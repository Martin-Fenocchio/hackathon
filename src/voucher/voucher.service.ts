import { Injectable } from '@nestjs/common';
import { Transfer } from '../transfers/entities/transfer.entity';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import { TemplateDelegate } from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VoucherService {
	private readonly template: TemplateDelegate;

	constructor() {
		// Try to find template in both src and dist directories
		const possiblePaths = [
			path.join(__dirname, 'templates', 'voucher.hbs'),
			path.join(__dirname, '..', '..', 'src', 'voucher', 'templates', 'voucher.hbs')
		];

		let templatePath = possiblePaths.find(p => fs.existsSync(p));
		
		if (!templatePath) {
			throw new Error('Voucher template not found. Please ensure the template file exists and is copied to the dist directory.');
		}

		const templateContent = fs.readFileSync(templatePath, 'utf-8');
		this.template = handlebars.compile(templateContent);
	}

	async generateVoucherImage(transfer: Transfer): Promise<Buffer> {
		const browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});

		try {
			const page = await browser.newPage();
			
			// Set viewport to match our template size
			await page.setViewport({
				width: 800,
				height: 500,
				deviceScaleFactor: 2 // For better quality
			});

			// Prepare the data for the template
			const templateData = { 
				coinType: '$PESOS',  
				amount: transfer.amount.toLocaleString('es-AR'),
				transferid: transfer.transferid,
				destination_publickey: transfer.destination_publickey,
				date: new Date().toLocaleString('es-AR')
			};

			// Render the template with data
			const html = this.template(templateData);

			// Set the content
			await page.setContent(html, {
				waitUntil: 'networkidle0'
			});

			// Take screenshot
			const screenshot = await page.screenshot({
				type: 'png',
				fullPage: true
			});

			return screenshot as Buffer;
		} finally {
			await browser.close();
		}
	}
} 