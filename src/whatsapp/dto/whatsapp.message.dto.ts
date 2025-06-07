import { WhatsAppMessageType } from '../enum/message.types.enum';

export class SimpleIncomingMessagePayload {
  object: string;
  entry: {
    id: string;
    changes: {
      value: {
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages: SimpleIncomingMessage[];
        contacts: {
          profile: {
            name: string;
          };
        }[];
      };
    }[];
  }[];

  constructor(partial: Partial<SimpleIncomingMessagePayload>) {
    Object.assign(this, partial);
  }

  public get text() {
    if (!this.entry[0]?.changes[0]?.value?.messages) return;
    return this.entry[0].changes[0].value.messages[0].text?.body;
  }

  public get name() {
    if (!this.entry[0]?.changes[0]?.value?.contacts) return;
    return this.entry[0].changes[0].value.contacts[0].profile.name;
  }

  public get audio() {
    if (!this.entry[0]?.changes[0]?.value?.messages) return;
    return this.entry[0].changes[0].value.messages[0]?.audio;
  }

  public get image() {
    if (!this.entry[0]?.changes[0]?.value?.messages) return;
    return this.entry[0].changes[0].value.messages[0]?.image;
  }

  public get interactive() {
    if (!this.entry[0]?.changes[0]?.value?.messages) return;
    return this.entry[0].changes[0].value.messages[0]?.interactive;
  }

  public get buttonPressed() {
    if (!this.entry[0]?.changes[0]?.value?.messages) return;
    const interactive = this.entry[0].changes[0].value.messages[0]?.interactive;
    return interactive?.button_reply?.id;
  }

  public get buttonText() {
    if (!this.entry[0]?.changes[0]?.value?.messages) return;
    const interactive = this.entry[0].changes[0].value.messages[0]?.interactive;
    return interactive?.button_reply?.title;
  }

  public get type() {
    if (!this.entry[0]?.changes[0]?.value?.messages) return;
    return this.entry[0].changes[0].value.messages[0].type;
  }

  public get phoneNumber() {
    if (!this.entry[0]?.changes[0]?.value?.messages) return;
    return this.entry[0].changes[0].value.messages[0].from;
  }

  public get messageId() {
    if (!this.entry[0]?.changes[0]?.value?.messages) return;
    return this.entry[0].changes[0].value.messages[0]?.id;
  }

  public get timestamp() {
    if (!this.entry[0]?.changes[0]?.value?.messages) return;
    return this.entry[0].changes[0].value.messages[0].timestamp;
  }

  public get isValidMessage() {
    const messages = this.entry[0]?.changes[0]?.value?.messages;

    return (
      messages?.length &&
      (messages[0].type === WhatsAppMessageType.TEXT ||
        messages[0].type === WhatsAppMessageType.AUDIO ||
        messages[0].type === WhatsAppMessageType.IMAGE ||
        messages[0].type === WhatsAppMessageType.INTERACTIVE)
    );
  }

  public get isValidMessageTime() {
    const message = this.entry[0]?.changes[0]?.value?.messages[0];
    const messageTime = Number(message.timestamp);
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime - messageTime <= 3600;
  }

  public get businessId() {
    if (!this.entry[0]?.id) return;
    return this.entry[0]?.id;
  }

  public get phoneNumberId() {
    if (!this.entry[0]?.changes[0]?.value?.metadata?.phone_number_id) return;
    return this.entry[0]?.changes[0]?.value?.metadata?.phone_number_id;
  }
}

export class SimpleRetrieveMediaUrlDto {
  url: string;
  file_size: string;
  id: string;
}

class SimpleBaseMessage {
  audio?: {
    id: string;
    mime_type?: string;
  };
  image?: {
    id: string;
    caption?: string;
    sha256?: string;
    mime_type?: string;
  };
  interactive?: {
    button_reply?: {
      id: string;
      title: string;
    };
  };
  text?: {
    body: string;
  };
  type: WhatsAppMessageType;
}

export class SimpleIncomingMessage extends SimpleBaseMessage {
  id: string;
  from: string;
  timestamp: string;
}

export class SimpleOutgoingMessage extends SimpleBaseMessage {
  messaging_product = 'whatsapp';
  to: string;
  recipient_type = 'individual';
  context?: {
    message_id: string;
  };

  constructor(partial: Partial<SimpleOutgoingMessage>) {
    super();
    Object.assign(this, partial);

    switch (true) {
      case !!this.text:
        this.type = WhatsAppMessageType.TEXT;
        break;
      case !!this.audio:
        this.type = WhatsAppMessageType.AUDIO;
        break;
      case !!this.image:
        this.type = WhatsAppMessageType.IMAGE;
        break;
      default:
        this.type = WhatsAppMessageType.TEXT;
    }
  }
}

export class SimpleIncomingMessageContent {
  type: WhatsAppMessageType;
  text?: string;
  media?: {
    text: string;
    mimetype: string;
    buffer?: Buffer;
  };
  metadata?: {
    messageId?: string;
    [key: string]: any;
  };
}

export class SimpleMessageContext {
  messageId: string;

  constructor(messageId: string) {
    this.messageId = messageId;
  }
}
