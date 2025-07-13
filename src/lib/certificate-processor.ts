export interface CertificateData {
  type: string;
  extractedFields: Record<string, string | number>;
  confidence: number;
  processingTime: number;
  originalFile: File;
  rawText: string;
  verifiableCredential?: VerifiableCredential;
}

export interface VerifiableCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
    type: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    type: string;
    [key: string]: any;
  };
  proof: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
  credentialSchema?: {
    id: string;
    type: string;
  };
  evidence?: {
    id: string;
    type: string;
    verifier: string;
    evidenceDocument: string;
    subjectPresence: string;
    documentPresence: string;
  }[];
}

export interface ProcessingResult {
  success: boolean;
  data?: CertificateData;
  error?: string;
}

export class CertificateProcessor {
  private static instance: CertificateProcessor;

  private constructor() {}

  static getInstance(): CertificateProcessor {
    if (!CertificateProcessor.instance) {
      CertificateProcessor.instance = new CertificateProcessor();
    }
    return CertificateProcessor.instance;
  }

  /**
   * Process a certificate file and extract relevant data
   */
  async processCertificate(file: File, certificateType: string): Promise<ProcessingResult> {
    try {
      const startTime = Date.now();
      
      // Validate file
      if (!this.validateFile(file)) {
        return {
          success: false,
          error: "Invalid file format. Please upload PDF, JPG, JPEG, or PNG files."
        };
      }

      // Extract text from the file using real OCR
      const extractedText = await this.extractTextFromFile(file);
      
      if (!extractedText || extractedText.trim().length === 0) {
        return {
          success: false,
          error: "No text could be extracted from the uploaded file. Please ensure the document is clear and readable."
        };
      }

      // Extract structured data based on certificate type
      const extractedData = await this.extractStructuredData(extractedText, certificateType);
      
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          type: certificateType,
          extractedFields: extractedData,
          confidence: this.calculateConfidence(extractedData, certificateType),
          processingTime,
          originalFile: file,
          rawText: extractedText
        }
      };
    } catch (error) {
      console.error("Error processing certificate:", error);
      return {
        success: false,
        error: "Failed to process certificate. Please try again."
      };
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }

  /**
   * Extract text from uploaded file using real OCR
   */
  private async extractTextFromFile(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
      return await this.extractTextFromPDF(file);
    } else {
      return await this.extractTextFromImage(file);
    }
  }

  /**
   * Extract text from PDF file using PDF.js
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    try {
      // Load PDF.js dynamically
      const pdfjsLib = await this.loadPDFJS();
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText.trim();
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error("Failed to extract text from PDF. Please ensure the PDF is not password protected.");
    }
  }

  /**
   * Extract text from image file using Tesseract.js
   */
  private async extractTextFromImage(file: File): Promise<string> {
    try {
      // Load Tesseract.js dynamically
      const Tesseract = await this.loadTesseract();
      
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log(m)
      });
      
      return result.data.text;
    } catch (error) {
      console.error("Error extracting text from image:", error);
      throw new Error("Failed to extract text from image. Please ensure the image is clear and readable.");
    }
  }

  /**
   * Load PDF.js library dynamically
   */
  private async loadPDFJS(): Promise<any> {
    if (typeof window !== 'undefined') {
      // Load PDF.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      document.head.appendChild(script);
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          const pdfjsLib = (window as any).pdfjsLib;
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(pdfjsLib);
        };
        script.onerror = reject;
      });
    }
    throw new Error("PDF.js can only be loaded in browser environment");
  }

  /**
   * Load Tesseract.js library dynamically
   */
  private async loadTesseract(): Promise<any> {
    if (typeof window !== 'undefined') {
      // Load Tesseract.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      document.head.appendChild(script);
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          resolve((window as any).Tesseract);
        };
        script.onerror = reject;
      });
    }
    throw new Error("Tesseract.js can only be loaded in browser environment");
  }

  /**
   * Extract structured data from extracted text using pattern matching
   */
  private async extractStructuredData(text: string, type: string): Promise<Record<string, string | number>> {
    const lowerText = text.toLowerCase();
    const originalText = text;
    
    switch (type) {
      case "IncomeCertificate":
        return this.extractIncomeData(lowerText, originalText);
      case "CasteCertificate":
        return this.extractCasteData(lowerText, originalText);
      case "AcademicCertificate":
        return this.extractAcademicData(lowerText, originalText);
      case "DisabilityCertificate":
        return this.extractDisabilityData(lowerText, originalText);
      case "DomicileCertificate":
        return this.extractDomicileData(lowerText, originalText);
      default:
        return {};
    }
  }

  /**
   * Extract income certificate data with enhanced pattern matching
   */
  private extractIncomeData(lowerText: string, originalText: string): Record<string, string | number> {
    const data: Record<string, string | number> = {
      currency: "INR",
      financialYear: "2023-24",
      certificateType: "Income Certificate",
      documentCategory: "Financial Document",
      verificationMethod: "OCR Extraction"
    };

    // Extract annual income with multiple patterns - Enhanced for better detection
    const incomePatterns = [
      // Indian number format patterns (most specific first)
      /(?:annual|yearly|total|gross)\s*(?:income|salary|earnings?)\s*:?\s*[₹]?\s*(\d{1,2}(?:,\d{2})*(?:,\d{3})*)/gi,
      /income\s*:?\s*[₹]?\s*(\d{1,2}(?:,\d{2})*(?:,\d{3})*)/gi,
      /[₹]?\s*(\d{1,2}(?:,\d{2})*(?:,\d{3})*)\s*(?:rupees?|rs?)/gi,
      /(?:income|salary)\s*:?\s*[₹]?\s*(\d{1,2}(?:,\d{2})*(?:,\d{3})*)/gi,
      /[₹]?\s*(\d{1,2}(?:,\d{2})*(?:,\d{3})*)\s*(?:only|inr)/gi,
      /(?:total|gross)\s*(?:income|salary)\s*:?\s*[₹]?\s*(\d{1,2}(?:,\d{2})*(?:,\d{3})*)/gi,
      /(?:monthly|month)\s*(?:income|salary)\s*:?\s*[₹]?\s*(\d{1,2}(?:,\d{2})*(?:,\d{3})*)/gi,
      
      // Additional patterns for various formats
      /(?:income|salary)\s*(?:is|of|amount)\s*:?\s*[₹]?\s*(\d{1,2}(?:,\d{2})*(?:,\d{3})*)/gi,
      /(?:rs\.?|rupees?)\s*:?\s*(\d{1,2}(?:,\d{2})*(?:,\d{3})*)/gi,
      /(\d{1,2}(?:,\d{2})*(?:,\d{3})*)\s*(?:rs\.?|rupees?|only)/gi,
      /(?:amount|value)\s*:?\s*[₹]?\s*(\d{1,2}(?:,\d{2})*(?:,\d{3})*)/gi,
      
      // Western number format patterns (fallback)
      /(?:annual|yearly|total|gross)\s*(?:income|salary|earnings?)\s*:?\s*[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /income\s*:?\s*[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|rs?)/gi,
      /(?:income|salary)\s*:?\s*[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:only|inr)/gi,
      /(?:total|gross)\s*(?:income|salary)\s*:?\s*[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:monthly|month)\s*(?:income|salary)\s*:?\s*[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      
      // Additional patterns for various formats
      /(?:income|salary)\s*(?:is|of|amount)\s*:?\s*[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:rs\.?|rupees?)\s*:?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs\.?|rupees?|only)/gi,
      /(?:amount|value)\s*:?\s*[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      
      // Simple number patterns (fallback)
      /(\d{4,8})\s*(?:per\s*annum|p\.?a\.?|annually)/gi,
      /(\d{4,8})\s*(?:rupees?|rs?)/gi,
      
      // Very simple patterns for basic extraction
      /(?:income|salary)\s*:?\s*(\d{3,8})/gi,
      
      // Generic number patterns (most permissive)
      /(\d{4,8})/g
    ];

    const allMatches: Array<{value: number, pattern: string}> = [];
    
    // First pass: collect all potential matches
    for (const pattern of incomePatterns) {
      const matches = originalText.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          // Handle Indian number format (e.g., 5,00,000 -> 500000)
          let incomeValue = match[1].replace(/,/g, '');
          
          // Special handling for Indian format: if it looks like Indian format, convert properly
          if (match[1].includes(',') && match[1].split(',').length > 1) {
            const parts = match[1].split(',');
            // Check if it's Indian format (last part has 3 digits, others have 2)
            if (parts[parts.length - 1].length === 3 && 
                parts.slice(0, -1).every(part => part.length === 2)) {
              // It's Indian format, remove all commas
              incomeValue = match[1].replace(/,/g, '');
            } else {
              // It's Western format, remove all commas
              incomeValue = match[1].replace(/,/g, '');
            }
          }
          
          const parsedIncome = parseInt(incomeValue);
          
          // More permissive validation (1,000 to 10,000,000)
          if (parsedIncome >= 1000 && parsedIncome <= 10000000) {
            allMatches.push({
              value: parsedIncome,
              pattern: pattern.source
            });
            console.log(`Found potential income: ${match[1]} -> ${parsedIncome}`);
          }
        }
      }
    }

    // Sort matches by pattern specificity (earlier patterns are more specific)
    allMatches.sort((a, b) => {
      const aIndex = incomePatterns.findIndex(p => p.source === a.pattern);
      const bIndex = incomePatterns.findIndex(p => p.source === b.pattern);
      return aIndex - bIndex;
    });

    // Use the most specific match
    if (allMatches.length > 0) {
      const bestMatch = allMatches[0];
      data.annualIncome = bestMatch.value;
      console.log(`Income extracted: ${bestMatch.value} from pattern: ${bestMatch.pattern}`);
      console.log(`All potential matches:`, allMatches);
    }

    // Debug: Log if no income was found
    if (!data.annualIncome) {
      console.log("No income amount found in text. Available text:", originalText.substring(0, 500));
      console.log("Full text for debugging:", originalText);
      
      // Try to find any numbers in the text
      const allNumbers = originalText.match(/\d+/g);
      console.log("All numbers found in text:", allNumbers);
    }

    // Extract applicant name
    const namePatterns = [
      /(?:applicant|name|person)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:name)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:mr\.?|mrs\.?|ms\.?)\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of namePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.applicantName = match[1].trim();
        break;
      }
    }

    // Extract father's name
    const fatherPatterns = [
      /(?:father|father's|fathers)\s*(?:name)?\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:s\/o|son\s+of|daughter\s+of)\s*([a-zA-Z\s]+)/gi,
      /(?:father)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of fatherPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.fatherName = match[1].trim();
        break;
      }
    }

    // Extract address
    const addressPatterns = [
      /(?:address|residence|village|town)\s*:?\s*([a-zA-Z0-9\s,.-]+)/gi,
      /(?:address)\s*:?\s*([a-zA-Z0-9\s,.-]+)/gi,
      /(?:village|town)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of addressPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.address = match[1].trim();
        break;
      }
    }

    // Extract district
    const districtPatterns = [
      /(?:district|taluk)\s*:?\s*([a-zA-Z\s]+)/gi,
      /district\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:taluk)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of districtPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.district = match[1].trim();
        break;
      }
    }

    // Extract state
    const statePatterns = [
      /(?:state|province)\s*:?\s*([a-zA-Z\s]+)/gi,
      /state\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of statePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.state = match[1].trim();
        break;
      }
    }

    // Extract pin code
    const pinPatterns = [
      /(?:pin|pincode|postal)\s*(?:code)?\s*:?\s*(\d{6})/gi,
      /(\d{6})/g
    ];

    for (const pattern of pinPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.pinCode = match[1];
        break;
      }
    }

    // Extract issuing authority
    const authorityPatterns = [
      /(?:issued\s+by|authority|office)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:tahsildar|revenue|municipal)\s*(?:office|department)/gi,
      /(?:tahsildar|revenue|municipal)\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of authorityPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.issuedBy = match[1] ? match[1].trim() : match[0].trim();
        break;
      }
    }

    // Extract certificate number
    const certPatterns = [
      /(?:certificate|cert)\s*(?:no|number)\s*:?\s*([a-zA-Z0-9\/\-]+)/gi,
      /cert\s*:?\s*([a-zA-Z0-9\/\-]+)/gi,
      /(?:no|number)\s*:?\s*([a-zA-Z0-9\/\-]+)/gi
    ];

    for (const pattern of certPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.certificateNumber = match[1].trim();
        break;
      }
    }

    // Extract issue date
    const datePatterns = [
      /(?:date|issued|on)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g
    ];

    for (const pattern of datePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.issueDate = match[1];
        break;
      }
    }

    // Extract financial year
    const fyPatterns = [
      /(?:financial|fiscal)\s*(?:year|yr)\s*:?\s*(\d{4}[\/\-]\d{2,4})/gi,
      /(?:fy|f\.y)\s*:?\s*(\d{4}[\/\-]\d{2,4})/gi,
      /(\d{4}[\/\-]\d{2,4})/g
    ];

    for (const pattern of fyPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.financialYear = match[1];
        break;
      }
    }

    // Extract occupation
    const occupationPatterns = [
      /(?:occupation|profession|job)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:occupation)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:work|employment)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of occupationPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.occupation = match[1].trim();
        break;
      }
    }

    // Extract mother's name
    const motherPatterns = [
      /(?:mother|mother's|mothers)\s*(?:name)?\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:d\/o|daughter\s+of)\s*([a-zA-Z\s]+)/gi,
      /(?:mother)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of motherPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.motherName = match[1].trim();
        break;
      }
    }

    // Extract age
    const agePatterns = [
      /(?:age)\s*:?\s*(\d{1,2})\s*(?:years?|yrs?)/gi,
      /(\d{1,2})\s*(?:years?\s*old|yrs?\s*old)/gi,
      /(?:age)\s*:?\s*(\d{1,2})/gi
    ];

    for (const pattern of agePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.age = parseInt(match[1]);
        break;
      }
    }

    // Extract gender
    const genderPatterns = [
      /(?:gender|sex)\s*:?\s*(male|female|other)/gi,
      /(male|female|other)/gi
    ];

    for (const pattern of genderPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.gender = match[1].toLowerCase();
        break;
      }
    }

    // Extract marital status
    const maritalPatterns = [
      /(?:marital|marriage)\s*(?:status)?\s*:?\s*(single|married|divorced|widowed)/gi,
      /(single|married|divorced|widowed)/gi
    ];

    for (const pattern of maritalPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.maritalStatus = match[1].toLowerCase();
        break;
      }
    }

    // Extract village/town
    const villagePatterns = [
      /(?:village|town)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:village)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:town)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of villagePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.village = match[1].trim();
        break;
      }
    }

    // Extract taluk/tehsil
    const talukPatterns = [
      /(?:taluk|tehsil)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:taluk)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:tehsil)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of talukPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.taluk = match[1].trim();
        break;
      }
    }

    // Extract block
    const blockPatterns = [
      /(?:block)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:development\s+block)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of blockPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.block = match[1].trim();
        break;
      }
    }

    // Extract police station
    const policePatterns = [
      /(?:police\s+station|ps)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:police)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of policePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.policeStation = match[1].trim();
        break;
      }
    }

    // Extract post office
    const postPatterns = [
      /(?:post\s+office|po)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:post)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of postPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.postOffice = match[1].trim();
        break;
      }
    }

    // Extract phone number
    const phonePatterns = [
      /(?:phone|mobile|contact)\s*(?:no|number)?\s*:?\s*(\d{10})/gi,
      /(\d{10})/g,
      /(?:phone|mobile)\s*:?\s*(\d{3,4}[-\s]?\d{3,4}[-\s]?\d{4})/gi
    ];

    for (const pattern of phonePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.phoneNumber = match[1];
        break;
      }
    }

    // Extract email
    const emailPatterns = [
      /(?:email|e-mail)\s*:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    ];

    for (const pattern of emailPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.email = match[1];
        break;
      }
    }

    // Extract Aadhaar number
    const aadhaarPatterns = [
      /(?:aadhaar|aadhar|uid)\s*(?:no|number)?\s*:?\s*(\d{4}[-\s]?\d{4}[-\s]?\d{4})/gi,
      /(\d{4}[-\s]?\d{4}[-\s]?\d{4})/g
    ];

    for (const pattern of aadhaarPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.aadhaarNumber = match[1];
        break;
      }
    }

    // Extract PAN number
    const panPatterns = [
      /(?:pan|permanent\s+account\s+number)\s*(?:no|number)?\s*:?\s*([A-Z]{5}[0-9]{4}[A-Z]{1})/gi,
      /([A-Z]{5}[0-9]{4}[A-Z]{1})/g
    ];

    for (const pattern of panPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.panNumber = match[1];
        break;
      }
    }

    // Extract bank account details
    const bankPatterns = [
      /(?:bank|account)\s*(?:no|number)?\s*:?\s*(\d{9,18})/gi,
      /(?:account)\s*:?\s*(\d{9,18})/gi,
      /(\d{9,18})/g
    ];

    for (const pattern of bankPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.bankAccountNumber = match[1];
        break;
      }
    }

    // Extract IFSC code
    const ifscPatterns = [
      /(?:ifsc|ifsc\s+code)\s*:?\s*([A-Z]{4}0[A-Z0-9]{6})/gi,
      /([A-Z]{4}0[A-Z0-9]{6})/gi
    ];

    for (const pattern of ifscPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.ifscCode = match[1];
        break;
      }
    }

    // Extract bank name
    const bankNamePatterns = [
      /(?:bank\s+name|bank)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:sbi|state\s+bank|hdfc|icici|axis|pnb)/gi
    ];

    for (const pattern of bankNamePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.bankName = match[1] ? match[1].trim() : match[0].trim();
        break;
      }
    }

    // Extract branch name
    const branchPatterns = [
      /(?:branch|branch\s+name)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:branch)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of branchPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.branchName = match[1].trim();
        break;
      }
    }

    // Extract family income
    const familyIncomePatterns = [
      /(?:family|total\s+family)\s*(?:income|salary)\s*:?\s*[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:family)\s*:?\s*[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi
    ];

    for (const pattern of familyIncomePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.familyIncome = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Extract number of family members
    const familyMembersPatterns = [
      /(?:family\s+members|members|dependents)\s*:?\s*(\d{1,2})/gi,
      /(\d{1,2})\s*(?:family\s+members|members)/gi
    ];

    for (const pattern of familyMembersPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.familyMembers = parseInt(match[1]);
        break;
      }
    }

    // Extract caste category
    const castePatterns = [
      /(?:caste|category)\s*:?\s*(sc|st|obc|general|scheduled\s+caste|scheduled\s+tribe|other\s+backward\s+class)/gi,
      /(sc|st|obc|general)\s*(?:caste|category)/gi
    ];

    for (const pattern of castePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        const caste = match[1].toUpperCase();
        data.caste = caste === 'SCHEDULED CASTE' ? 'SC' : 
                     caste === 'SCHEDULED TRIBE' ? 'ST' : 
                     caste === 'OTHER BACKWARD CLASS' ? 'OBC' : caste;
        break;
      }
    }

    // Extract religion
    const religionPatterns = [
      /(?:religion)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:hindu|muslim|christian|sikh|buddhist|jain)/gi
    ];

    for (const pattern of religionPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.religion = match[1] ? match[1].trim() : match[0].trim();
        break;
      }
    }

    // Extract education qualification
    const educationPatterns = [
      /(?:education|qualification|degree)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:education)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of educationPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.educationQualification = match[1].trim();
        break;
      }
    }

    // Extract purpose of certificate
    const purposePatterns = [
      /(?:purpose|for|use)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:scholarship|admission|job|loan|benefit)/gi
    ];

    for (const pattern of purposePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.purpose = match[1] ? match[1].trim() : match[0].trim();
        break;
      }
    }

    // Extract validity period
    const validityPatterns = [
      /(?:valid|validity)\s*(?:till|until|up\s+to)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
      /(?:valid)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi
    ];

    for (const pattern of validityPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.validityDate = match[1];
        break;
      }
    }

    // Extract remarks/comments
    const remarksPatterns = [
      /(?:remarks|comments|notes)\s*:?\s*([a-zA-Z0-9\s,.-]+)/gi,
      /(?:remarks)\s*:?\s*([a-zA-Z0-9\s,.-]+)/gi
    ];

    for (const pattern of remarksPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.remarks = match[1].trim();
        break;
      }
    }

    // Extract officer name
    const officerPatterns = [
      /(?:officer|signature|signed\s+by)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:officer)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of officerPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.officerName = match[1].trim();
        break;
      }
    }

    // Extract designation
    const designationPatterns = [
      /(?:designation|post)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:designation)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of designationPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.designation = match[1].trim();
        break;
      }
    }

    // Extract office address
    const officeAddressPatterns = [
      /(?:office\s+address|office)\s*:?\s*([a-zA-Z0-9\s,.-]+)/gi,
      /(?:office)\s*:?\s*([a-zA-Z0-9\s,.-]+)/gi
    ];

    for (const pattern of officeAddressPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.officeAddress = match[1].trim();
        break;
      }
    }

    // Extract office phone
    const officePhonePatterns = [
      /(?:office\s+phone|office\s+contact)\s*:?\s*(\d{10})/gi,
      /(?:office)\s*:?\s*(\d{10})/gi
    ];

    for (const pattern of officePhonePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.officePhone = match[1];
        break;
      }
    }

    // Extract office email
    const officeEmailPatterns = [
      /(?:office\s+email|office\s+e-mail)\s*:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    ];

    for (const pattern of officeEmailPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.officeEmail = match[1];
        break;
      }
    }

    // Extract stamp/seal information
    const stampPatterns = [
      /(?:stamp|seal|official\s+seal)\s*:?\s*([a-zA-Z\s]+)/gi,
      /(?:stamp)\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of stampPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.stampSeal = match[1].trim();
        break;
      }
    }

    // Extract document number
    const documentPatterns = [
      /(?:document\s+no|document\s+number)\s*:?\s*([a-zA-Z0-9\/\-]+)/gi,
      /(?:document)\s*:?\s*([a-zA-Z0-9\/\-]+)/gi
    ];

    for (const pattern of documentPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.documentNumber = match[1].trim();
        break;
      }
    }

    // Extract application number
    const applicationPatterns = [
      /(?:application\s+no|application\s+number|app\s+no)\s*:?\s*([a-zA-Z0-9\/\-]+)/gi,
      /(?:application)\s*:?\s*([a-zA-Z0-9\/\-]+)/gi
    ];

    for (const pattern of applicationPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.applicationNumber = match[1].trim();
        break;
      }
    }

    // Extract receipt number
    const receiptPatterns = [
      /(?:receipt\s+no|receipt\s+number|receipt)\s*:?\s*([a-zA-Z0-9\/\-]+)/gi,
      /(?:receipt)\s*:?\s*([a-zA-Z0-9\/\-]+)/gi
    ];

    for (const pattern of receiptPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.receiptNumber = match[1].trim();
        break;
      }
    }

    // Extract fee amount
    const feePatterns = [
      /(?:fee|fees|amount|payment)\s*:?\s*[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:fee)\s*:?\s*[₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi
    ];

    for (const pattern of feePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.feeAmount = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Extract payment date
    const paymentDatePatterns = [
      /(?:payment\s+date|paid\s+on)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
      /(?:payment)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi
    ];

    for (const pattern of paymentDatePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.paymentDate = match[1];
        break;
      }
    }

    // Extract verification status
    const verificationPatterns = [
      /(?:verified|verification|status)\s*:?\s*(verified|pending|rejected|approved)/gi,
      /(verified|pending|rejected|approved)/gi
    ];

    for (const pattern of verificationPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.verificationStatus = match[1].toLowerCase();
        break;
      }
    }

    // Extract verification date
    const verificationDatePatterns = [
      /(?:verified\s+on|verification\s+date)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
      /(?:verified)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi
    ];

    for (const pattern of verificationDatePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.verificationDate = match[1];
        break;
      }
    }

    return data;
  }

  /**
   * Extract caste certificate data with enhanced pattern matching
   */
  private extractCasteData(lowerText: string, originalText: string): Record<string, string | number> {
    const data: Record<string, string | number> = {};

    // Extract caste category with multiple patterns
    const castePatterns = [
      /(?:caste|category)\s*:?\s*(sc|st|obc|general|scheduled\s+caste|scheduled\s+tribe|other\s+backward\s+class)/gi,
      /caste\s*:?\s*(sc|st|obc|general)/gi,
      /(sc|st|obc|general)\s*(?:caste|category)/gi
    ];

    for (const pattern of castePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        const caste = match[1].toUpperCase();
        data.caste = caste === 'SCHEDULED CASTE' ? 'SC' : 
                     caste === 'SCHEDULED TRIBE' ? 'ST' : 
                     caste === 'OTHER BACKWARD CLASS' ? 'OBC' : caste;
        data.category = this.getCasteCategory(data.caste as string);
        break;
      }
    }

    // Extract district
    const districtPatterns = [
      /(?:district|taluk)\s*:?\s*([a-zA-Z\s]+)/gi,
      /district\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of districtPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.district = match[1].trim();
        break;
      }
    }

    // Extract state
    const statePatterns = [
      /(?:state|province)\s*:?\s*([a-zA-Z\s]+)/gi,
      /state\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of statePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.state = match[1].trim();
        break;
      }
    }

    // Extract certificate number
    const certPatterns = [
      /(?:certificate|cert)\s*(?:no|number)\s*:?\s*([a-zA-Z0-9\/\-]+)/gi,
      /cert\s*:?\s*([a-zA-Z0-9\/\-]+)/gi
    ];

    for (const pattern of certPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.certificateNumber = match[1].trim();
        break;
      }
    }

    return data;
  }

  /**
   * Extract academic certificate data with enhanced pattern matching
   */
  private extractAcademicData(lowerText: string, originalText: string): Record<string, string | number> {
    const data: Record<string, string | number> = {};

    // Extract degree with multiple patterns
    const degreePatterns = [
      /(?:degree|qualification)\s*:?\s*(bachelor|master|phd|b\.?tech|b\.?e|b\.?sc|b\.?com|b\.?a)/gi,
      /degree\s*:?\s*(bachelor|master|phd|b\.?tech|b\.?e|b\.?sc|b\.?com|b\.?a)/gi
    ];

    for (const pattern of degreePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.degree = this.expandDegree(match[1]);
        break;
      }
    }

    // Extract specialization
    const specPatterns = [
      /(?:specialization|branch|stream|subject)\s*:?\s*([a-zA-Z\s]+)/gi,
      /branch\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of specPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.specialization = match[1].trim();
        break;
      }
    }

    // Extract CGPA
    const cgpaPatterns = [
      /(?:cgpa|gpa|grade)\s*:?\s*(\d+\.?\d*)/gi,
      /cgpa\s*:?\s*(\d+\.?\d*)/gi
    ];

    for (const pattern of cgpaPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.cgpa = parseFloat(match[1]);
        break;
      }
    }

    // Extract graduation year
    const yearPatterns = [
      /(?:graduation|completion|passing)\s*(?:year|date)\s*:?\s*(\d{4})/gi,
      /year\s*:?\s*(\d{4})/gi
    ];

    for (const pattern of yearPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.graduationYear = parseInt(match[1]);
        break;
      }
    }

    // Extract university
    const uniPatterns = [
      /(?:university|institution|college)\s*:?\s*([a-zA-Z\s]+)/gi,
      /university\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of uniPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.university = match[1].trim();
        break;
      }
    }

    // Extract roll number
    const rollPatterns = [
      /(?:roll\s*(?:no|number)|student\s*id)\s*:?\s*([a-zA-Z0-9]+)/gi,
      /roll\s*:?\s*([a-zA-Z0-9]+)/gi
    ];

    for (const pattern of rollPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.rollNumber = match[1].trim();
        break;
      }
    }

    return data;
  }

  /**
   * Extract disability certificate data with enhanced pattern matching
   */
  private extractDisabilityData(lowerText: string, originalText: string): Record<string, string | number> {
    const data: Record<string, string | number> = {};

    // Extract disability type
    const disabilityPatterns = [
      /(?:disability|impairment)\s*(?:type)?\s*:?\s*(none|visual|hearing|physical|intellectual|mental)/gi,
      /disability\s*:?\s*(none|visual|hearing|physical|intellectual|mental)/gi
    ];

    for (const pattern of disabilityPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.disabilityType = match[1];
        break;
      }
    }

    // Extract percentage
    const percentPatterns = [
      /(?:percentage|extent)\s*:?\s*(\d+)%/gi,
      /(\d+)%\s*(?:disability|impairment)/gi
    ];

    for (const pattern of percentPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.percentage = parseInt(match[1]);
        break;
      }
    }

    // Extract district
    const districtPatterns = [
      /(?:district|taluk)\s*:?\s*([a-zA-Z\s]+)/gi,
      /district\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of districtPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.district = match[1].trim();
        break;
      }
    }

    // Extract state
    const statePatterns = [
      /(?:state|province)\s*:?\s*([a-zA-Z\s]+)/gi,
      /state\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of statePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.state = match[1].trim();
        break;
      }
    }

    return data;
  }

  /**
   * Extract domicile certificate data with enhanced pattern matching
   */
  private extractDomicileData(lowerText: string, originalText: string): Record<string, string | number> {
    const data: Record<string, string | number> = {};

    // Extract domicile state
    const statePatterns = [
      /(?:domicile|native)\s*(?:state|province)\s*:?\s*([a-zA-Z\s]+)/gi,
      /domicile\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of statePatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.domicileState = match[1].trim();
        break;
      }
    }

    // Extract district
    const districtPatterns = [
      /(?:district|taluk)\s*:?\s*([a-zA-Z\s]+)/gi,
      /district\s*:?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of districtPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.district = match[1].trim();
        break;
      }
    }

    // Extract duration
    const durationPatterns = [
      /(?:duration|period|residing)\s*:?\s*(\d+)\s*(?:years?|yrs?)/gi,
      /(\d+)\s*(?:years?|yrs?)\s*(?:residence|domicile)/gi
    ];

    for (const pattern of durationPatterns) {
      const match = pattern.exec(originalText);
      if (match) {
        data.duration = `${match[1]} years`;
        break;
      }
    }

    return data;
  }

  /**
   * Calculate confidence score for extracted data
   */
  private calculateConfidence(data: Record<string, string | number>, type: string): number {
    const requiredFields = this.getRequiredFields(type);
    let foundFields = 0;
    
    for (const field of requiredFields) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        foundFields++;
      }
    }
    
    const baseConfidence = foundFields / requiredFields.length;
    const randomVariation = (Math.random() - 0.5) * 0.1;
    return Math.max(0.3, Math.min(0.98, baseConfidence + randomVariation));
  }

  // Helper methods
  private getCasteCategory(caste: string): string {
    switch (caste) {
      case "SC": return "Scheduled Caste";
      case "ST": return "Scheduled Tribe";
      case "OBC": return "Other Backward Class";
      default: return "General";
    }
  }

  private expandDegree(abbreviation: string): string {
    switch (abbreviation.toLowerCase()) {
      case 'b.tech':
      case 'btech':
        return 'Bachelor of Technology';
      case 'b.e':
      case 'be':
        return 'Bachelor of Engineering';
      case 'b.sc':
      case 'bsc':
        return 'Bachelor of Science';
      case 'b.com':
      case 'bcom':
        return 'Bachelor of Commerce';
      case 'b.a':
      case 'ba':
        return 'Bachelor of Arts';
      default:
        return abbreviation;
    }
  }

  /**
   * Generate a comprehensive Verifiable Credential from extracted certificate data
   */
  generateVerifiableCredential(
    extractedData: Record<string, string | number>,
    certificateType: string,
    studentName: string,
    originalFile: File,
    confidence: number
  ): VerifiableCredential {
    const credentialId = `urn:uuid:${this.generateUUID()}`;
    const issuanceDate = new Date().toISOString();
    const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

    // Create comprehensive credential subject with all extracted fields
    const credentialSubject: Record<string, any> = {
      id: `did:ethr:${this.generateWalletAddress()}`,
      type: certificateType,
      studentName: studentName,
      certificateType: certificateType,
      extractionConfidence: confidence,
      extractionTimestamp: issuanceDate,
      originalFileName: originalFile.name,
      originalFileSize: originalFile.size,
      originalFileType: originalFile.type,
      ...extractedData // Include all extracted fields
    };

    // Add certificate-specific metadata
    switch (certificateType) {
      case "IncomeCertificate":
        credentialSubject.credentialCategory = "Financial";
        credentialSubject.credentialPurpose = "Scholarship Eligibility";
        credentialSubject.incomeVerificationMethod = "OCR Extraction";
        credentialSubject.currency = extractedData.currency || "INR";
        credentialSubject.financialYear = extractedData.financialYear || "2023-24";
        break;
      case "CasteCertificate":
        credentialSubject.credentialCategory = "Identity";
        credentialSubject.credentialPurpose = "Reservation Eligibility";
        credentialSubject.casteVerificationMethod = "OCR Extraction";
        credentialSubject.category = extractedData.category || "General";
        break;
      case "AcademicCertificate":
        credentialSubject.credentialCategory = "Education";
        credentialSubject.credentialPurpose = "Academic Verification";
        credentialSubject.academicVerificationMethod = "OCR Extraction";
        credentialSubject.degreeLevel = this.getDegreeLevel(extractedData.degree as string);
        break;
      case "DisabilityCertificate":
        credentialSubject.credentialCategory = "Health";
        credentialSubject.credentialPurpose = "Disability Benefits";
        credentialSubject.disabilityVerificationMethod = "OCR Extraction";
        credentialSubject.disabilityCategory = this.getDisabilityCategory(extractedData.disabilityType as string);
        break;
      case "DomicileCertificate":
        credentialSubject.credentialCategory = "Residence";
        credentialSubject.credentialPurpose = "State Benefits";
        credentialSubject.domicileVerificationMethod = "OCR Extraction";
        break;
    }

    // Create evidence array for the original document
    const evidence = [{
      id: `urn:uuid:${this.generateUUID()}`,
      type: "DocumentVerificationEvidence",
      verifier: "Self-Issued Certificate Processor",
      evidenceDocument: originalFile.name,
      subjectPresence: "Digital",
      documentPresence: "Digital",
      verificationMethod: "OCR Text Extraction",
      confidence: confidence,
      extractionTimestamp: issuanceDate
    }];

    // Create the comprehensive VC
    const vc: VerifiableCredential = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1"
      ],
      id: credentialId,
      type: ["VerifiableCredential", certificateType],
      issuer: {
        id: `did:ethr:${this.generateWalletAddress()}`,
        name: studentName,
        type: "SelfIssuer"
      },
      issuanceDate: issuanceDate,
      expirationDate: expirationDate,
      credentialSubject: credentialSubject,
      proof: {
        type: "Ed25519Signature2020",
        created: issuanceDate,
        proofPurpose: "assertionMethod",
        verificationMethod: `did:ethr:${this.generateWalletAddress()}#keys-1`,
        jws: this.generateMockJWS(credentialId, issuanceDate)
      },
      credentialSchema: {
        id: `https://schemas.example.com/${certificateType.toLowerCase()}`,
        type: "JsonSchemaValidator2018"
      },
      evidence: evidence
    };

    return vc;
  }

  /**
   * Generate a UUID for credential IDs
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate a mock wallet address
   */
  private generateWalletAddress(): string {
    return '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  /**
   * Generate a mock JWS signature
   */
  private generateMockJWS(credentialId: string, timestamp: string): string {
    const header = btoa(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
      iss: credentialId, 
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 31536000 // 1 year
    }));
    const signature = btoa('mock-signature-' + Date.now());
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Get degree level from degree name
   */
  private getDegreeLevel(degree: string): string {
    const lowerDegree = degree.toLowerCase();
    if (lowerDegree.includes('phd') || lowerDegree.includes('doctorate')) return 'Doctorate';
    if (lowerDegree.includes('master') || lowerDegree.includes('m.') || lowerDegree.includes('ms')) return 'Masters';
    if (lowerDegree.includes('bachelor') || lowerDegree.includes('b.') || lowerDegree.includes('be') || lowerDegree.includes('btech')) return 'Bachelors';
    if (lowerDegree.includes('diploma')) return 'Diploma';
    if (lowerDegree.includes('12th') || lowerDegree.includes('hsc')) return 'Higher Secondary';
    if (lowerDegree.includes('10th') || lowerDegree.includes('ssc')) return 'Secondary';
    return 'Other';
  }

  /**
   * Get disability category from disability type
   */
  private getDisabilityCategory(disabilityType: string): string {
    const lowerType = disabilityType.toLowerCase();
    if (lowerType.includes('visual') || lowerType.includes('blind')) return 'Visual Impairment';
    if (lowerType.includes('hearing') || lowerType.includes('deaf')) return 'Hearing Impairment';
    if (lowerType.includes('physical') || lowerType.includes('mobility')) return 'Physical Disability';
    if (lowerType.includes('mental') || lowerType.includes('intellectual')) return 'Intellectual Disability';
    if (lowerType.includes('autism') || lowerType.includes('asd')) return 'Autism Spectrum';
    return 'Other';
  }

  // Enhanced income extraction with better Indian number format support
  extractIncome(text: string): number | null {
    console.log("Extracting income from text:", text);
    
    // Enhanced patterns for Indian number formats
    const patterns = [
      // Indian format: ₹5,00,000 or Rs. 5,00,000
      /(?:₹|Rs\.?)\s*([0-9,]+(?:,[0-9]{2})*(?:,[0-9]{3})*)/gi,
      // International format: $50,000 or 50,000
      /(?:[$]?)\s*([0-9,]+(?:,[0-9]{3})*)/gi,
      // Plain numbers with "income" context
      /(?:income|salary|earnings?|annual\s+income|total\s+income|family\s+income|monthly\s+income)[:\s]*([0-9,]+(?:,[0-9]{2})*(?:,[0-9]{3})*)/gi,
      // Numbers followed by currency indicators
      /([0-9,]+(?:,[0-9]{2})*(?:,[0-9]{3})*)\s*(?:rupees?|rs\.?|₹|inr)/gi,
      // Numbers in parentheses or brackets
      /[\(\[\{]\s*([0-9,]+(?:,[0-9]{2})*(?:,[0-9]{3})*)\s*[\)\]\}]/gi
    ];

    let bestMatch: number | null = null;
    let highestAmount = 0;

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      
      for (const match of matches) {
        const amountStr = match[1]?.replace(/,/g, '');
        if (!amountStr) continue;
        
        const amount = parseInt(amountStr, 10);
        
        if (!isNaN(amount) && amount >= 1000 && amount <= 10000000) {
          console.log(`Found income amount: ${amount} from pattern: ${pattern}`);
          
          // Prefer larger amounts as they're more likely to be annual income
          if (amount > highestAmount) {
            highestAmount = amount;
            bestMatch = amount;
          }
        }
      }
    }

    console.log("Final income extraction result:", bestMatch);
    return bestMatch;
  }

  // Test income extraction with multiple formats
  testIncomeExtraction(text: string): ExtractedData {
    console.log("Testing income extraction with text:", text);
    
    const extractedData: ExtractedData = {
      annualIncome: null,
      applicantName: null,
      fatherName: null,
      district: null,
      state: null,
      issuedBy: null,
      issueDate: null,
      certificateNumber: null,
      category: null,
      confidence: 0
    };

    // Extract income
    const income = this.extractIncome(text);
    if (income) {
      extractedData.annualIncome = income;
      extractedData.confidence += 0.3;
    }

    // Extract applicant name
    const nameMatch = text.match(/(?:applicant|name|applicant['']s\s+name)[:\s]*([A-Za-z\s]+)/i);
    if (nameMatch) {
      extractedData.applicantName = nameMatch[1].trim();
      extractedData.confidence += 0.2;
    }

    // Extract father's name
    const fatherMatch = text.match(/(?:father['']s\s+name|father['']s\s+name)[:\s]*([A-Za-z\s]+)/i);
    if (fatherMatch) {
      extractedData.fatherName = fatherMatch[1].trim();
      extractedData.confidence += 0.2;
    }

    // Extract district
    const districtMatch = text.match(/(?:district)[:\s]*([A-Za-z\s]+)/i);
    if (districtMatch) {
      extractedData.district = districtMatch[1].trim();
      extractedData.confidence += 0.1;
    }

    // Extract state
    const stateMatch = text.match(/(?:state)[:\s]*([A-Za-z\s]+)/i);
    if (stateMatch) {
      extractedData.state = stateMatch[1].trim();
      extractedData.confidence += 0.1;
    }

    // Extract issuing authority
    const issuedByMatch = text.match(/(?:issued\s+by|authority)[:\s]*([A-Za-z\s]+)/i);
    if (issuedByMatch) {
      extractedData.issuedBy = issuedByMatch[1].trim();
      extractedData.confidence += 0.1;
    }

    console.log("Extraction result:", extractedData);
    return extractedData;
  }

  // Test multiple income formats
  testMultipleIncomeFormats(): void {
    console.log("Testing multiple income formats...");
    
    const testCases = [
      "Annual Income: ₹250,000",
      "Income: 85000",
      "Total Income: 1,50,000",
      "Salary: ₹50000",
      "Annual Income is 75000",
      "Income amount: 125000",
      "Rs. 95000",
      "₹1,25,000",
      "250000 rupees",
      "Income 65000",
      "Annual Income: 85000",
      "Total family income: ₹2,50,000",
      "Monthly income: 15000",
      "Income: 1,00,000 only",
      "Annual Income: 75000 INR",
      "Income: 5,00,000",
      "Annual Income: ₹5,00,000",
      "Total Income: 5,00,000 rupees",
      "Income: 5,00,000 only",
      "Salary: ₹5,00,000",
      "Annual Income is 5,00,000"
    ];

    testCases.forEach((testCase, index) => {
      const result = this.extractIncome(testCase);
      console.log(`Test ${index + 1}: "${testCase}" → ${result ? `₹${result.toLocaleString()}` : 'NOT FOUND'}`);
    });
  }

  /**
   * Validate extracted data against expected schema
   */
  validateExtractedData(data: Record<string, string | number>, type: string): boolean {
    const requiredFields = this.getRequiredFields(type);
    
    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get required fields for each certificate type
   */
  private getRequiredFields(type: string): string[] {
    switch (type) {
      case "IncomeCertificate":
        return [
          "annualIncome", "applicantName", "fatherName", "address", "district", "state", 
          "pinCode", "issuedBy", "certificateNumber", "issueDate", "financialYear", "occupation",
          "motherName", "age", "gender", "maritalStatus", "village", "taluk", "block", 
          "policeStation", "postOffice", "phoneNumber", "email", "aadhaarNumber", "panNumber",
          "bankAccountNumber", "ifscCode", "bankName", "branchName", "familyIncome", 
          "familyMembers", "caste", "religion", "educationQualification", "purpose", 
          "validityDate", "remarks", "officerName", "designation", "officeAddress", 
          "officePhone", "officeEmail", "stampSeal", "documentNumber", "applicationNumber",
          "receiptNumber", "feeAmount", "paymentDate", "verificationStatus", "verificationDate"
        ];
      case "CasteCertificate":
        return ["caste", "category", "district"];
      case "AcademicCertificate":
        return ["degree", "specialization", "cgpa", "graduationYear"];
      case "DisabilityCertificate":
        return ["disabilityType", "percentage", "district"];
      case "DomicileCertificate":
        return ["domicileState", "district", "duration"];
      default:
        return [];
    }
  }
}

// Export singleton instance
export const certificateProcessor = CertificateProcessor.getInstance(); 