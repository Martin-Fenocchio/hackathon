import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from './enum/roles.enum';
import { AIRole } from './enum/roles.enum';
import { OpenAIOptionsDto } from './dto/openai.dto';
import { OpenAIProvider } from './provider/openai.provider';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { OpenAIModel } from './enum/models.enum';

@Injectable()
export class AiService {
  private readonly openai: OpenAI;

  constructor(
    private readonly openAIProvider: OpenAIProvider,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? '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',
    });
  }

  public async chat<T>({
    messages,
    provider = AIProvider.OPENAI,
    model,
    temperature,
    maxTokens,
  }: OpenAIOptionsDto): Promise<any> {
    if (provider === AIProvider.OPENAI) {
      return await this.openAIProvider.getChatCompletion<T>({
        messages,
        model,
        temperature,
        maxTokens,
        // schema,
      });
    }

    throw new Error('Invalid provider');
  }

  public async processImageWithVision({ imageUrl, prompt }: { imageUrl: string; prompt: string }): Promise<string> {
    console.log('imageUrl', imageUrl);
    try {
      const response = await this.openai.chat.completions.create({
        model: OpenAIModel.GPT4O_MINI,
        messages: [
          {
            role: AIRole.USER,
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      return response.choices[0].message.content || 'No pude analizar la imagen.';
    } catch (error) {
      console.error('Error processing image with OpenAI Vision:', error);
      throw new Error('Error procesando imagen con OpenAI Vision');
    }
  }

  public async transcribeAudio({ audioBuffer, mimetype }: { audioBuffer: Buffer; mimetype: string }): Promise<string> {
    let tempFilePath: string | null = null;

    try {
      const extension = this.getAudioExtension(mimetype);

      tempFilePath = path.join(os.tmpdir(), `audio_${Date.now()}.${extension}`);
      fs.writeFileSync(tempFilePath, audioBuffer);

      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: OpenAIModel.WHISPER_1,
        language: 'es',
      });

      return transcription.text;
    } catch (error) {
      console.error('Error transcribing audio with OpenAI Whisper:', error);
      throw new Error('Error transcribiendo audio con OpenAI Whisper');
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.error('Error cleaning up temp file:', cleanupError);
        }
      }
    }
  }

  private getAudioExtension(mimetype: string): string {
    const mimeToExt: Record<string, string> = {
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/m4a': 'm4a',
      'audio/aac': 'aac',
    };

    return mimeToExt[mimetype] || 'ogg';
  }
}
