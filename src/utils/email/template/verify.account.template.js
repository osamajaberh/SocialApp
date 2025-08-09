export const verifyAccountTemplate = ({ code } = {}) => {
    return `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2>Email Verification</h2>
        <p>Please use the code below to verify your email address:</p>
        <div style="font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0;">
            ${code}
        </div>
        <p>This code will expire soon. If you did not request this, please ignore this email.</p>
        <hr>
        <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} SocialMediaApp. All rights reserved.</p>
    </div>
    `;
};
