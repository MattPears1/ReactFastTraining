import axios from "axios";

class AdminAuthTestService {
  async testLogin() {
    console.log("🚨 USING TEST LOGIN ENDPOINT");
    
    const baseURL = import.meta.env.PROD ? "" : "http://localhost:3000";
    
    try {
      const response = await axios.post(`${baseURL}/api/test-login`, {
        email: "lex@reactfasttraining.co.uk",
        password: "anything"
      });
      
      console.log("✅ TEST LOGIN RESPONSE:", response.data);
      
      // Store the test token
      if (response.data.accessToken) {
        localStorage.setItem("adminAccessToken", response.data.accessToken);
      }
      
      return response.data;
    } catch (error: any) {
      console.error("❌ TEST LOGIN ERROR:", error);
      throw error;
    }
  }
}

export const adminAuthTestService = new AdminAuthTestService();