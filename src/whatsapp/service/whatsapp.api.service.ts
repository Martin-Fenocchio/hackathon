/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import FormData from 'form-data';
import {
  SimpleOutgoingMessage,
  SimpleIncomingMessageContent,
  SimpleIncomingMessagePayload,
} from '../dto/whatsapp.message.dto';
import { WhatsAppMessageType } from '../enum/message.types.enum';

@Injectable()
export class WhatsappApiService {
  private readonly baseEndpoint: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly logger = new Logger(WhatsappApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseEndpoint = this.buildBaseEndpoint();
    this.accessToken =
      'EAAKoxqZChBtkBO61UoSDNUVRqTxZCNOvm03O53OSGHl6ZCzIMZA5he5pVYvFAtLiOUxEqRmBuAlwoht2wTyyDFH1666WayKXH3ZAiMgqzbHjLhhW5rLdXLEZBRiYkEKvOc3fxxsDO86QZB8WADjmw0L8ditrvjMZAWczwMCTzONHllZCuNzGlrTGhYPs5zcGhZAaHHK8wU7xGMMmEBJi1G3mbVfumleZBVzNp4XAGMZD';
    this.phoneNumberId = '720551657798613';
  }

  private buildBaseEndpoint(): string {
    const apiUrl = 'https://graph.facebook.com';
    const apiVersion = 'v23.0';
    return `${apiUrl}/${apiVersion}`;
  }

  /**
   * Envía un mensaje a través de la API de WhatsApp
   * @param outgoingMessage Mensaje a enviar
   * @returns ID del mensaje enviado
   */
  public async sendMessage(outgoingMessage: SimpleOutgoingMessage): Promise<string> {
    this.logger.debug(`Enviando message tipo ${outgoingMessage.type} a ${outgoingMessage.to}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseEndpoint}/${this.phoneNumberId}/messages`, outgoingMessage, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      console.log(outgoingMessage, 'outgoingMessage');

      const messageId = (response.data as any)?.messages?.[0]?.id;
      this.logger.debug(`Mensaje enviado con ID: ${messageId}`);
      return messageId;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Error desconocido';
      const errorDetails = error.response?.data?.error?.error_data?.details || 'Sin detalles';

      this.logger.error(`Error enviando message tipo ${outgoingMessage.type} a ${outgoingMessage.to}: ${errorMessage}`);

      throw new Error(`Error enviando message: ${errorMessage}. Detalles: ${errorDetails}`);
    }
  }

  /**
   * Envía un mensaje de texto simple
   * @param sendTo Número de teléfono del destinatario
   * @param message Texto del mensaje
   * @param incomingMessage Mensaje entrante (opcional, para respuestas)
   * @returns ID del mensaje enviado
   */
  public async sendTextMessage(
    sendTo: string,
    message: string,
    incomingMessage?: SimpleIncomingMessagePayload,
  ): Promise<string> {
    if (!sendTo || !message) {
      throw new Error('El destinatario y el mensaje son requeridos');
    }

    const body: any = {
      to: '541126336301',
      text: {
        body: message,
      },
    };

    if (incomingMessage?.messageId) {
      body.context = { message_id: incomingMessage.messageId };
    }

    this.logger.debug(`Enviando mensaje de texto a ${sendTo}`);
    return this.sendMessage(new SimpleOutgoingMessage(body));
  }

  /**
   * Envía un mensaje con contenido multimedia (imagen o audio)
   * @param sendTo Número de teléfono del destinatario
   * @param mediaId ID del archivo multimedia previamente subido
   * @param mediaType Tipo de media (image o audio)
   * @param caption Texto descriptivo (opcional, solo para imágenes)
   * @param incomingMessage Mensaje entrante (opcional, para respuestas)
   * @returns ID del mensaje enviado
   */
  public async sendMediaMessage(
    sendTo: string,
    mediaId: string,
    mediaType: 'image' | 'audio',
    caption?: string,
    incomingMessage?: SimpleIncomingMessagePayload,
  ): Promise<string> {
    if (!sendTo || !mediaId || !mediaType) {
      throw new Error('El destinatario, ID de media y tipo de media son requeridos');
    }

    if (!['image', 'audio'].includes(mediaType)) {
      throw new Error('Solo se permiten tipos de media: image, audio');
    }

    const mediaContent: any = { id: mediaId };

    if (mediaType === 'image' && caption) {
      mediaContent.caption = caption;
    }

    const body: any = {
      to: sendTo,
      [mediaType]: mediaContent,
    };

    if (incomingMessage?.messageId) {
      body.context = { message_id: incomingMessage.messageId };
    }

    this.logger.debug(`Enviando mensaje de ${mediaType} a ${sendTo}`);
    return this.sendMessage(new SimpleOutgoingMessage(body));
  }

  /**
   * Procesa el contenido de un mensaje entrante
   * Solo maneja: TEXTO, IMAGEN y AUDIO
   * @param message Mensaje entrante de WhatsApp
   * @returns Contenido estructurado del mensaje
   */
  public async getMessageContent(message: SimpleIncomingMessagePayload): Promise<{
    incomingMessageContent: SimpleIncomingMessageContent;
  }> {
    let incomingMessageContent: SimpleIncomingMessageContent;

    try {
      switch (message.type) {
        case WhatsAppMessageType.TEXT:
          incomingMessageContent = {
            text: message.text,
            type: WhatsAppMessageType.TEXT,
          };
          console.log('incomingMessageContent', JSON.stringify(incomingMessageContent));

          break;

        case WhatsAppMessageType.IMAGE: {
          if (!message.image?.id) {
            throw new Error('ID de imagen no encontrado');
          }
          const imageBuffer = await this.downloadMedia(message.image.id);
          incomingMessageContent = {
            media: {
              text: message.image.caption || '',
              mimetype: message.image.mime_type || 'image/jpeg',
              buffer: imageBuffer,
            },
            type: WhatsAppMessageType.IMAGE,
          };
          break;
        }

        case WhatsAppMessageType.AUDIO: {
          if (!message.audio?.id) {
            throw new Error('ID de audio no encontrado');
          }
          const audioBuffer = await this.downloadMedia(message.audio.id);
          incomingMessageContent = {
            media: {
              text: '',
              mimetype: message.audio.mime_type || 'audio/ogg',
              buffer: audioBuffer,
            },
            type: WhatsAppMessageType.AUDIO,
          };
          break;
        }

        default:
          throw new Error(`Tipo de message no soportado: ${message.type}`);
      }

      return { incomingMessageContent };
    } catch (error: any) {
      this.logger.error(`Error procesando message entrante: ${error.message}`, error.stack);
      throw new Error(`Error procesando message tipo ${message.type}: ${error.message}`);
    }
  }

  /**
   * Descarga un archivo multimedia de WhatsApp
   * @param mediaId ID del archivo multimedia a descargar
   * @returns Buffer con el contenido del archivo
   */
  private async downloadMedia(mediaId: string): Promise<Buffer> {
    try {
      this.logger.debug(`Descargando archivo multimedia con ID: ${mediaId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseEndpoint}/${mediaId}`, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      const mediaUrl = (response.data as any)?.url;
      if (!mediaUrl) {
        throw new Error(`No se pudo obtener la URL del archivo ${mediaId}`);
      }

      const mediaResponse = await firstValueFrom(
        this.httpService.get(mediaUrl, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          responseType: 'arraybuffer',
        }),
      );

      this.logger.debug(`Archivo descargado exitosamente: ${mediaId}`);
      return Buffer.from(mediaResponse.data as ArrayBuffer);
    } catch (error: any) {
      this.logger.error(`Error descargando archivo ${mediaId}: ${error.message}`, error.stack);
      throw new Error(`Error descargando archivo multimedia: ${error.message}`);
    }
  }

  /**
   * Sube un archivo para enviarlo a través de WhatsApp
   * @param filePath Ruta del archivo a subir
   * @returns ID del archivo generado por WhatsApp
   */
  public async uploadMedia(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe en la ruta: ${filePath}`);
    }

    try {
      const formData: FormData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('file', fs.createReadStream(filePath));

      this.logger.debug(`Subiendo archivo: ${filePath}`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseEndpoint}/${this.phoneNumberId}/media`, formData, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            ...formData.getHeaders(),
          },
        }),
      );

      const mediaId = (response.data as any)?.id;
      this.logger.debug(`Archivo subido con ID: ${mediaId}`);
      return mediaId;
    } catch (error: any) {
      this.logger.error(`Error subiendo archivo ${filePath}: ${error.message}`, error.stack);
      throw new Error(`Error subiendo archivo: ${error.message}`);
    }
  }

  public async sendTypingIndicator(messageId: string, phoneNumber: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseEndpoint}/${this.phoneNumberId}/messages`,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phoneNumber,
            status: 'read',
            message_id: messageId,
            typing_indicator: {
              type: 'text',
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return true;
    } catch (error: any) {
      this.logger.error(`Error sending typing indicator: ${error.message}`, error.stack);
      return false;
    }
  }
}
