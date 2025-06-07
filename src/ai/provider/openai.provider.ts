/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OpenAIModel } from '../enum/models.enum';
import { AIRole } from '../enum/roles.enum';
import { OpenAIOptionsDto } from '../dto/openai.dto';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { zodResponseFormat } from 'openai/helpers/zod';
import { OpenAI } from 'openai';

@Injectable()
export class OpenAIProvider {
  private readonly openAI: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openAI = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? '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',
    });
  }

  public async getCompletion<T>(
    prompt: string,
    model: OpenAIModel,
    temperature: number = 0.6,
    maxTokens: number = 1024,
  ): Promise<T> {
    const completion = await this.openAI.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [{ role: AIRole.USER, content: prompt }],
    });
    const response = completion.choices[0].message.content;

    return response as T;
  }

  public async getChatCompletion<T>({ messages, model, temperature, maxTokens, schema }: OpenAIOptionsDto): Promise<T> {
    try {
      if (schema) {
        try {
          const parsed = await this.openAI.chat.completions.parse({
            model: model as string,
            messages: messages as ChatCompletionMessageParam[],
            max_tokens: maxTokens,
            response_format: zodResponseFormat(schema, 'nutritionalAnalysisSchema'),
          });

          if (parsed.choices[0].finish_reason === 'length') {
            throw new Error('Incomplete response');
          }

          const response = parsed.choices[0].message;

          if (response.refusal) {
            return response.refusal as T;
          } else if (response.parsed) {
            return response.parsed as T;
          } else {
            throw new Error('No response content');
          }
        } catch (error) {
          console.error(error);
          throw new Error('Error parsing OpenAI response');
        }
      }

      const completion = await this.openAI.chat.completions.create({
        messages: messages as ChatCompletionMessageParam[],
        model: model as string,
        temperature,
        max_tokens: maxTokens,
      });

      return completion.choices[0].message.content as T;
    } catch (error) {
      console.error(error);
      throw new Error('Error  OpenAI response');
    }
  }
}
