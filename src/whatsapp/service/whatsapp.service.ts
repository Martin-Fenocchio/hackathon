/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SimpleIncomingMessageContent } from '../../whatsapp/dto/whatsapp.message.dto';
import { WhatsappApiService } from '../../whatsapp/service/whatsapp.api.service';
import { AiService } from '../../ai/ai.service';
import { OpenAIModel } from 'src/ai/enum/models.enum';
import { AIRole } from 'src/ai/enum/roles.enum';
import { AIMessage } from '../../ai/dto/message.dto';
import nutritionalAnalysisPrompt from '../../ai/utils/prompt/agent.prompt';
import imageDescriptionPrompt from '../../ai/utils/prompt/imageDescription.prompt';
import { nutritionalAnalysisSchema } from '../../ai/schema';
import { ConversationMessage } from '../../ai/interfaces/completions';

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
  ) {
    this.verificationToken = 'hackathon';
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';

    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (!this.phoneNumberId) {
      this.logger.warn('Missing WHATSAPP_PHONE_NUMBER_ID');
    }
  }

  verifyWebhook(mode: string, token: string, challenge: string): number {
    this.logger.debug(`Verifying webhook - Mode: ${mode}, Token: ${token}`);

    console.log('verifyWebhook', mode, token, challenge);

    if (mode !== 'subscribe' || token !== 'hackathon') {
      this.logger.warn(`Webhook verification failed: invalid token`);
      throw new HttpException('Invalid verification token', HttpStatus.FORBIDDEN);
    }

    return parseInt(challenge);
  }
  /* 
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
 */
  /*  private async processMessage(message: SimpleIncomingMessagePayload): Promise<void> {
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
          await this.handleTextMessage(phoneNumber, incomingMessageContent.text || '');
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
 */
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

  private async handleTextMessage(phoneNumber: string, text: string) {
    try {
      this.logger.log(`Mensaje de texto recibido de ${phoneNumber}: ${text}`);

      const history = this.getConversationHistory(phoneNumber);

      this.addToConversationHistory(phoneNumber, AIRole.USER, text);

      const response = await this.aiService.chat({
        messages: [
          {
            role: AIRole.SYSTEM,
            content: nutritionalAnalysisPrompt,
          },
          ...history,
          {
            role: AIRole.USER,
            content: text,
          },
        ],
        model: OpenAIModel.GPT4O_MINI,
        maxTokens: 800,
        schema: nutritionalAnalysisSchema,
      });

      this.addToConversationHistory(phoneNumber, AIRole.ASSISTANT, response.responseText);

      await this.whatsappApiService.sendTextMessage(phoneNumber, response.responseText);
    } catch (error) {
      this.logger.error('Error procesando mensaje de texto:', error);
      await this.whatsappApiService.sendTextMessage(
        phoneNumber,
        'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.',
      );
    }
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

  /*  private async handleMediaMessage(
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
  } */

  /*   private async processImageWithAI(
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
        schema: nutritionalAnalysisSchema,
      });

      if (phoneNumber) {
        await this.addToConversationHistory(phoneNumber, AIRole.USER, `image : ${imageResponse}`);

        await this.addToConversationHistory(
          phoneNumber,
          AIRole.ASSISTANT,
          aiResponse?.responseText || 'Análisis de imagen completado',
        );
      }

      const formattedMessage = this.formatNutritionalResponse(aiResponse);

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
  } */

  private async processAudioWithAI(messageContent: SimpleIncomingMessageContent, phoneNumber: string): Promise<string> {
    try {
      if (!messageContent.media?.buffer) {
        throw new Error('No audio buffer found');
      }

      const transcription = await this.aiService.transcribeAudio({
        audioBuffer: messageContent.media.buffer,
        mimetype: messageContent.media.mimetype || 'audio/ogg',
      });

      const history = this.getConversationHistory(phoneNumber);

      const response = await this.aiService.chat({
        messages: [
          {
            role: AIRole.SYSTEM,
            content: nutritionalAnalysisPrompt,
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
        schema: nutritionalAnalysisSchema,
      });

      return response.responseText;
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
