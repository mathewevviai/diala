// convex/email-templates.ts - Page-specific email templates
export const emailTemplates = {
  calls: {
    subject: "Complete your Diala Calling Setup",
    color: "rgb(0,82,255)",
    emoji: "📞",
    description: "Unlock real-time calling features"
  },
  
  transcribe: {
    subject: "Verify for Audio Transcription",
    color: "#ff006e", 
    emoji: "🎤",
    description: "Access advanced audio transcription"
  },
  
  hunter: {
    subject: "Activate Lead Generation Tools",
    color: "#8b5cf6",
    emoji: "🎯", 
    description: "Start generating qualified leads"
  },
  
  cloning: {
    subject: "Set Up Voice Cloning Profile",
    color: "#06ffa5",
    emoji: "🗣️",
    description: "Create your personalized AI voice"
  },
  
  procedural: {
    subject: "Enable Procedural Audio",
    color: "#ff4757",
    emoji: "🎵",
    description: "Generate dynamic audio content"
  }
};

export function generateNeobrutalistEmail(page: string, otp: string, userData?: any) {
  const template = emailTemplates[page] || emailTemplates.calls;
  
  return `
    <div style="
      font-family: 'Noyh-Bold', 'Arial Black', sans-serif; 
      max-width: 600px; 
      margin: 0 auto; 
      border: 3px solid #000;
      box-shadow: 8px 8px 0px rgba(0,0,0,0.3);
      background: white;
    ">
      <!-- Header with Memphis design -->
      <div style="
        background: ${template.color}; 
        color: white; 
        padding: 40px 30px; 
        text-align: center;
        border-bottom: 3px solid #000;
        position: relative;
        overflow: hidden;
      ">
        <!-- Memphis pattern background -->
        <div style="
          position: absolute;
          top: 10px;
          right: 20px;
          width: 30px;
          height: 30px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
        "></div>
        <div style="
          position: absolute;
          bottom: 15px;
          left: 30px;
          width: 20px;
          height: 20px;
          background: rgba(255,255,255,0.2);
          transform: rotate(45deg);
        "></div>
        
        <h2 style="
          font-size: 28px; 
          margin: 0; 
          font-weight: 900; 
          text-transform: uppercase;
          letter-spacing: 1px;
        ">
          ${template.emoji} ${template.subject}
        </h2>
        
        <p style="
          margin: 15px 0 0 0; 
          opacity: 0.9; 
          font-size: 16px;
          font-weight: 400;
        ">
          ${template.description}
        </p>
      </div>
      
      <!-- Main content with bold Memphis styling -->
      <div style="
        background: white; 
        padding: 40px 30px;
        border-bottom: 3px solid #000;
      ">
        
        <!-- Memphis accent shapes -->
        <div style="
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
        ">
          <div style="
            width: 40px;
            height: 40px;
            background: ${template.color};
            border-radius: 50%;
            opacity: 0.8;
          "></div>
          <div style="
            width: 25px;
            height: 25px;
            background: #FFD700;
            transform: rotate(45deg);
            align-self: center;
          "></div>
        </div>
        
        <h3 style="
          font-size: 22px;
          margin: 0 0 20px 0;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
        ">
          YOUR VERIFICATION CODE
        </h3>
        
        <p style="
          font-size: 16px; 
          margin-bottom: 30px; 
          line-height: 1.5;
          color: #333;
        ">
          Use this ${page}-specific code to complete your setup:
        </p>
        
        <!-- Bold OTP display -->
        <div style="
          background: #FFD700; 
          padding: 30px; 
          text-align: center; 
          border: 3px solid #000;
          margin: 30px 0;
          position: relative;
        ">
          <!-- Memphis decorative elements -->
          <div style="
            position: absolute;
            top: -10px;
            right: -10px;
            width: 20px;
            height: 20px;
            background: ${template.color};
            border-radius: 50%;
          "></div>
          
          <div style="
            font-size: 36px; 
            font-weight: 900; 
            letter-spacing: 8px; 
            font-family: 'Courier New', monospace;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.3);
          ">
            ${otp}
          </div>
        </div>
        
        <!-- Info box with Memphis styling -->
        <div style="
          background: #f5f5f5; 
          padding: 25px; 
          border-left: 6px solid ${template.color};
          margin: 30px 0;
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 10px;
            left: -3px;
            width: 15px;
            height: 15px;
            background: #FFD700;
            transform: rotate(45deg);
          "></div>
          
          <p style="
            margin: 0; 
            font-weight: 900; 
            font-size: 16px;
            text-transform: uppercase;
          ">
            ⏰ This code expires in 15 minutes
          </p>
          
          <p style="
            margin: 10px 0 0 0; 
            font-size: 14px; 
            color: #666;
            line-height: 1.4;
          ">
            Didn't receive it? Check your spam folder or request a new code. 
            This is a secure, one-time verification process.
          </p>
        </div>
      </div>
      
      <!-- Footer with brand identity -->
      <div style="
        background: #f8f9fa; 
        padding: 30px; 
        text-align: center; 
        font-size: 12px; 
        color: #666;
        border-top: 3px solid #000;
      ">
        <p style="margin: 0; font-weight: 900; text-transform: uppercase;">
          This is an automated email from Diala
        </p>
        <p style="margin: 5px 0 0 0; font-size: 11px;">
          Please do not reply to this email
        </p>
      </div>
    </div>
  `;
}

export function getEmailPreview(page: string) {
  return generateNeobrutalistEmail(page, "123456");
}

// Export templates for easy access
export { emailTemplates };