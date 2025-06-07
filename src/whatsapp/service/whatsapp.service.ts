/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SimpleIncomingMessageContent, SimpleIncomingMessagePayload } from '../../whatsapp/dto/whatsapp.message.dto';
import { WhatsappApiService } from '../../whatsapp/service/whatsapp.api.service';
import { AiService } from '../../ai/ai.service';
import { OpenAIModel } from 'src/ai/enum/models.enum';
import { AIRole } from 'src/ai/enum/roles.enum';
import { AIMessage } from '../../ai/dto/message.dto';
import nutritionalAnalysisPrompt from '../../ai/utils/prompt/agent.prompt';
import imageDescriptionPrompt from '../../ai/utils/prompt/imageDescription.prompt';
import { ConversationMessage } from '../../ai/interfaces/completions';
import { WhatsAppMessageType } from '../enum/message.types.enum';
import { SolanaService } from 'src/solana/solana.service';

@Injectable()
export class WhatsAppService {
  private readonly verificationToken: string;
  private readonly phoneNumberId: string;
  private readonly logger = new Logger(WhatsAppService.name);

  private conversationCache = new Map<string, ConversationMessage[]>();
  private readonly MAX_MESSAGES_PER_USER = 10;

  constructor(
    private readonly configService: ConfigService,
    private readonly whatsappApiService: WhatsappApiService,
    private readonly aiService: AiService,
    private readonly solanaService: SolanaService,
  ) {
    this.verificationToken = 'hackathon';
    this.phoneNumberId = '720551657798613';
  }

  verifyWebhook(mode: string, token: string, challenge: string): number {
    console.log('verifyWebhook', mode, token, challenge);
    this.logger.debug(`Verifying webhook - Mode: ${mode}, Token: ${token}`);

    if (mode !== 'subscribe' || token !== 'hackathon') {
      this.logger.warn(`Webhook verification failed: invalid token`);
      throw new HttpException('Invalid verification token', HttpStatus.FORBIDDEN);
    }

    return parseInt(challenge);
  }

  async handleWebhookPost(message: SimpleIncomingMessagePayload): Promise<{ status: number }> {
    try {
      if (message?.phoneNumberId !== this.phoneNumberId) {
        this.logger.debug('Message received for another WhatsApp number');
        return { status: 200 };
      }

      if (message?.isValidMessage) {
        this.logger.debug(`Valid message from: ${message.phoneNumber}`);
        await this.processMessage(message);
      }

      return { status: 200 };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing webhook: ${errorMessage}`, errorStack);
      return { status: 200 };
    }
  }
  private async processMessage(message: SimpleIncomingMessagePayload): Promise<void> {
    const messageId = message.messageId || 'unknown';
    const phoneNumber = message.phoneNumber;

    this.logger.debug(`Processing message ${messageId} from ${phoneNumber}`);

    if (!phoneNumber) {
      this.logger.warn(`Message ${messageId}: No phone number found`);
      return;
    }

    try {
      const { incomingMessageContent } = await this.whatsappApiService.getMessageContent(message);

      if (!incomingMessageContent?.type) {
        this.logger.warn(`Message ${messageId}: No content type found`);
        return;
      }

      switch (incomingMessageContent.type) {
        case WhatsAppMessageType.TEXT:
          await this.handleTextMessage(message);
          break;

        case WhatsAppMessageType.INTERACTIVE:
          await this.handleButtonPress(message);
          break;

        case WhatsAppMessageType.IMAGE:
          await this.handleMediaMessage(phoneNumber, incomingMessageContent, message, incomingMessageContent.type);
          break;

        case WhatsAppMessageType.AUDIO:
          await this.handleMediaMessage(phoneNumber, incomingMessageContent, message, incomingMessageContent.type);
          break;

        default:
          this.logger.warn(`Message ${messageId}: Unsupported message type: ${incomingMessageContent.type}`);
          await this.sendUnsupportedTypeMessage(phoneNumber);
          break;
      }

      this.logger.debug(`Message ${messageId} processed successfully`);
    } catch (error: unknown) {
      await this.handleProcessingError(error, messageId, phoneNumber);
    }
  }

  private async handleProcessingError(error: unknown, messageId: string, phoneNumber: string): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.logger.error(`Error processing message ${messageId} from ${phoneNumber}: ${errorMessage}`, errorStack);

    try {
      await this.sendErrorMessage(phoneNumber);
    } catch (sendError) {
      this.logger.error(
        `Failed to send error message to ${phoneNumber}:`,
        sendError instanceof Error ? sendError.message : 'Unknown error',
      );
    }
  }

  private async sendUnsupportedTypeMessage(phoneNumber: string): Promise<void> {
    try {
      await this.whatsappApiService.sendTextMessage(
        phoneNumber,
        'Lo siento, este tipo de mensaje no es compatible. Por favor envía texto, imagen o audio.',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send unsupported type message to ${phoneNumber}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  private async sendErrorMessage(phoneNumber: string): Promise<void> {
    await this.whatsappApiService.sendTextMessage(
      phoneNumber,
      'Ha ocurrido un error procesando tu mensaje. Por favor intenta nuevamente.',
    );
  }

  async handleTextMessage(message: SimpleIncomingMessagePayload) {
    // Validaciones iniciales
    if (!message.phoneNumber) {
      this.logger.error('Número de teléfono no disponible');
      return;
    }

    // Resto del código existente para mensajes de texto
    const text = message.text?.toLowerCase() || '';

    // Detectar si es el primer mensaje (saludo)
    const isFirstMessage =
      text &&
      (text.includes('hola') ||
        text.includes('hello') ||
        text.includes('hi') ||
        text.includes('buenos') ||
        text.includes('buenas'));

    if (isFirstMessage) {
      // Enviar mensaje con botones interactivos
      await this.whatsappApiService.sendInteractiveButtonMessage(
        message.phoneNumber,
        '¡Hola! 👋 Bienvenido a tu asistente de criptomonedas. ¿Qué te gustaría hacer?',
        [
          { id: 'create_wallet', title: 'Crear Wallet' },
          { id: 'import_wallet', title: 'Importar Wallet' },
        ],
        '🚀 Tu Asistente Crypto',
        'Selecciona una opción para continuar',
      );

      // Guardar en historial
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.conversationCache.set(message.phoneNumber, [
        {
          role: AIRole.USER,
          content: message.text || text,
        },
        {
          role: AIRole.ASSISTANT,
          content: 'Mensaje de bienvenida con botones enviado',
        },
      ]);

      return;
    }

    try {
      this.logger.log(`Mensaje de texto recibido de ${message.phoneNumber}: ${text}`);

      const history = this.getConversationHistory(message.phoneNumber);

      const response = await this.aiService.chat({
        messages: history,
        model: OpenAIModel.GPT4O_MINI,
        maxTokens: 800,
      });

      this.addToConversationHistory(message.phoneNumber, AIRole.ASSISTANT, response);

      await this.whatsappApiService.sendTextMessage(message.phoneNumber, response);
    } catch (error) {
      this.logger.error('Error procesando mensaje de texto:', error);
      await this.whatsappApiService.sendTextMessage(
        message.phoneNumber,
        'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.',
      );
    }
  }

  async handleButtonPress(message: SimpleIncomingMessagePayload) {
    const buttonId = message.buttonPressed;
    const buttonText = message.buttonText;
    const phoneNumber = message.phoneNumber;

    // Validaciones
    if (!phoneNumber) {
      this.logger.error('Número de teléfono no disponible en mensaje interactivo');
      return;
    }

    if (!buttonId) {
      this.logger.error('ID de botón no disponible');
      return;
    }

    console.log(`Botón presionado: ${buttonId} - ${buttonText || 'Sin título'}`);

    switch (buttonId) {
      case 'create_wallet':
        const wallet = await this.solanaService.createWallet();

        await this.whatsappApiService.sendTextMessage(
          phoneNumber,
          `¡Perfecto! 🎉 Hemos creado tu wallet.\n\n` +
            `🌎 Llave pública: ${wallet.publicKey}\n` +
            `🔒 Llave privada: ${wallet.secretKey}` +
            `¿Queres enviar pesos a un amigo? 💸`,
        );

        this.addToConversationHistory(
          phoneNumber,
          AIRole.ASSISTANT,
          `¡Perfecto! 🎉 Hemos creado tu wallet.\n\n +
            🌎 Llave pública: ${wallet.publicKey}\n
            🔒 Llave privada: ${wallet.secretKey} \n\n
            ¿Queres enviar pesos a un amigo? 💸 `,
        );

        break;

      case 'import_wallet':
        await this.whatsappApiService.sendTextMessage(
          phoneNumber,
          '💰 Para realizar una transferencia necesito la siguiente información:\n\n' +
            '1️⃣ Cantidad a transferir\n' +
            '2️⃣ Dirección de destino\n\n' +
            'Por favor, envía la cantidad que deseas transferir.',
        );

        this.addToConversationHistory(
          phoneNumber,
          AIRole.ASSISTANT,
          '💰 Para realizar una transferencia necesito la siguiente información:\n\n' +
            '1️⃣ Cantidad a transferir\n' +
            '2️⃣ Dirección de destino\n\n' +
            'Por favor, envía la cantidad que deseas transferir.',
        );

        break;

      default:
        await this.whatsappApiService.sendTextMessage(
          phoneNumber,
          'Opción no reconocida. Por favor, usa los botones disponibles.',
        );
    }

    // Actualizar historial de conversación
    const currentHistory = this.conversationCache.get(phoneNumber) || [];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    currentHistory.push({
      role: AIRole.USER,
      content: `Botón presionado: ${buttonText || buttonId}`,
    });
    this.conversationCache.set(phoneNumber, currentHistory);
  }

  async sendTextMessage(phoneNumber: string, text: string): Promise<void> {
    try {
      await this.whatsappApiService.sendTextMessage(phoneNumber, text);
      this.logger.debug(`Message sent to ${phoneNumber}: ${text}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error sending message to ${phoneNumber}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  private async handleMediaMessage(
    phoneNumber: string,
    messageContent: SimpleIncomingMessageContent,
    message: SimpleIncomingMessagePayload,
    mediaType: string,
  ): Promise<void> {
    try {
      this.logger.debug(`Processing ${mediaType} message from ${phoneNumber}`);

      if (message.messageId) {
        await this.whatsappApiService.sendTypingIndicator(message.messageId, phoneNumber);
      }

      let responseText = '';

      if (messageContent.type === WhatsAppMessageType.IMAGE) {
        responseText = await this.processImageWithAI(messageContent, phoneNumber);
      } else if (messageContent.type === WhatsAppMessageType.AUDIO) {
        responseText = await this.processAudioWithAI(messageContent, phoneNumber);
      }

      console.log(responseText, 'responseText');

      await this.whatsappApiService.sendTextMessage(phoneNumber, responseText, message);

      this.logger.debug(`${mediaType} processed and response sent to ${phoneNumber}`);
    } catch (error) {
      this.logger.error(
        `Error handling ${mediaType} message from ${phoneNumber}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );

      await this.whatsappApiService.sendTextMessage(
        phoneNumber,
        `Lo siento, hubo un error procesando tu ${mediaType}. Por favor intenta nuevamente.`,
        message,
      );
    }
  }

  private async processImageWithAI(
    messageContent: SimpleIncomingMessageContent,
    phoneNumber?: string,
  ): Promise<string> {
    try {
      if (!messageContent.media?.buffer) {
        throw new Error('No image buffer found');
      }

      const base64Image = messageContent.media.buffer.toString('base64');
      const imageUrl = `data:${messageContent.media.mimetype};base64,${base64Image}`;

      this.logger.debug('Sending image for nutritional analysis...');

      const imageResponse = await this.aiService.processImageWithVision({
        imageUrl,
        prompt: imageDescriptionPrompt,
      });

      const history = phoneNumber ? this.getConversationHistory(phoneNumber) : [];

      const aiResponse = await this.aiService.chat({
        messages: [
          {
            role: AIRole.SYSTEM,
            content: nutritionalAnalysisPrompt,
          },
          ...history,
          {
            role: AIRole.USER,
            content: `image description: ${imageResponse}`,
          },
        ],
        model: OpenAIModel.GPT4O_MINI,
        temperature: 0.2,
        maxTokens: 1200,
      });

      if (phoneNumber) {
        this.addToConversationHistory(phoneNumber, AIRole.USER, `image : ${imageResponse}`);

        this.addToConversationHistory(
          phoneNumber,
          AIRole.ASSISTANT,
          aiResponse?.responseText || 'Análisis de imagen completado',
        );
      }

      const formattedMessage = aiResponse;

      try {
        return formattedMessage;
      } catch (parseError) {
        this.logger.warn('Failed to parse AI response as JSON, using fallback format');
        return `📸 **Análisis Nutricional:**\n\n${aiResponse}\n\n💡 *Nota: Respuesta en formato de texto debido a error de procesamiento*`;
      }
    } catch (error) {
      this.logger.error('Error processing image with AI:', error);
      return '📸 He recibido tu imagen, pero no pude analizarla en este momento. Por favor intenta más tarde.';
    }
  }

  private async processAudioWithAI(messageContent: SimpleIncomingMessageContent, phoneNumber: string): Promise<string> {
    try {
      if (!messageContent.media?.buffer) {
        throw new Error('No audio buffer found');
      }

      const transcription = await this.aiService.transcribeAudio({
        audioBuffer: messageContent.media.buffer,
        mimetype: messageContent.media.mimetype || 'audio/ogg',
      });

      console.log(transcription, 'transcription');

      const history = this.getConversationHistory(phoneNumber);

      const response = await this.aiService.chat({
        messages: [
          {
            role: AIRole.SYSTEM,
            content: 'Responde en español',
          },
          ...history,
          {
            role: AIRole.USER,
            content: `audio transcription: ${transcription}`,
          },
        ],
        model: OpenAIModel.GPT4O_MINI,
        temperature: 0.2,
        maxTokens: 1200,
      });

      return response;
    } catch (error) {
      this.logger.error('Error processing audio with AI:', error);
      return '🎵 He recibido tu audio, pero no pude transcribirlo en este momento. Por favor intenta más tarde.';
    }
  }

  private getConversationHistory(phoneNumber: string): ConversationMessage[] {
    return this.conversationCache.get(phoneNumber) || [];
  }
  private addToConversationHistory(phoneNumber: string, role: AIRole, content: string) {
    const history = this.getConversationHistory(phoneNumber);

    history.push({
      role,
      content,
    });

    if (history.length > this.MAX_MESSAGES_PER_USER) {
      history.shift();
    }

    this.conversationCache.set(phoneNumber, history);
  }
}
