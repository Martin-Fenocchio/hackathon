import { Injectable } from '@nestjs/common';
import { createCanvas } from 'canvas';
import { Transfer } from '../transfers/entities/transfer.entity';

@Injectable()
export class VoucherService {
	async generateVoucherImage(transfer: Transfer): Promise<Buffer> {
		const width = 800;
		const height = 500;
		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext('2d');
	
		// Background
		ctx.fillStyle = '#f2f0ff'; // Soft violet background like Brubank
		ctx.fillRect(0, 0, width, height);
	
		// White rounded rectangle
		const cardX = 40;
		const cardY = 40;
		const cardWidth = width - 80;
		const cardHeight = height - 80;
		const radius = 20;
	
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.moveTo(cardX + radius, cardY);
		ctx.lineTo(cardX + cardWidth - radius, cardY);
		ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + radius);
		ctx.lineTo(cardX + cardWidth, cardY + cardHeight - radius);
		ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - radius, cardY + cardHeight);
		ctx.lineTo(cardX + radius, cardY + cardHeight);
		ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - radius);
		ctx.lineTo(cardX, cardY + radius);
		ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
		ctx.closePath();
		ctx.fill();
	
		// Title
		ctx.fillStyle = '#888';
		ctx.font = '20px Arial';
		ctx.textAlign = 'center';
		ctx.fillText('Transferencia realizada', width / 2, 80);
	
		// Amount
		ctx.fillStyle = '#000';
		ctx.font = 'bold 36px Arial';
		ctx.fillText(`$ ${transfer.amount.toLocaleString('es-AR')}`, width / 2, 130);
	
		// Status
		ctx.fillStyle = '#008000';
		ctx.font = '20px Arial';
		ctx.fillText('✓ Transferencia enviada', width / 2, 170);
	
		// Details Section
		ctx.textAlign = 'left';
		ctx.fillStyle = '#444';
		ctx.font = '18px Arial';
		const startY = 230;
		const lineHeight = 35;
	
		ctx.fillText(`ID de Transferencia: ${transfer.transferid}`, 80, startY);
		ctx.fillText(`Clave Pública Destino:`, 80, startY + lineHeight);
		ctx.fillText(`${transfer.destination_publickey}`, 80, startY + lineHeight * 2);
		ctx.fillText(`Fecha: ${transfer.created_at?.toLocaleString('es-AR') || new Date().toLocaleString('es-AR')}`, 80, startY + lineHeight * 3);
	
		// Border decoration
		ctx.strokeStyle = '#ddd';
		ctx.lineWidth = 2;
		ctx.strokeRect(60, 60, width - 120, height - 120);
	
		return canvas.toBuffer('image/png');
	}
} 