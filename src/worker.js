const { PDFParser } = require('pdf2json');
const mammoth = require('mammoth');
const axios = require('axios');

process.on('message', async (fileData) => {
  try {
    let text;
    
    if (fileData.mimetype === 'application/pdf') {
      const pdfParser = new PDFParser();
      text = await new Promise((resolve) => {
        pdfParser.on('pdfParser_dataReady', (data) => {
          resolve(pdfParser.getRawTextContent());
        });
        pdfParser.parseBuffer(Buffer.from(fileData.content));
      });
    } else if (fileData.mimetype.includes('wordprocessingml')) {
      const { value } = await mammoth.extractRawText({ 
        buffer: Buffer.from(fileData.content) 
      });
      text = value;
    }

    // Envoyer le texte traité à Supabase
    await axios.post(process.env.SUPABASE_URL + '/rest/v1/documents', {
      content: text,
      metadata: { source: fileData.name }
    }, {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_KEY}` }
    });

  } catch (error) {
    console.error('Erreur worker:', error);
  }
});
