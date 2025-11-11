// - - - src/api/billing-client.ts
import axios from "axios";

const billingClient = axios.create({
  baseURL: "https://billing.safaripro.net/api/v1",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// billingClient (Request Interceptor)
billingClient.interceptors.request.use(
  (config) => {
    console.log(`- - - Request Log: billingClient`, config);
    return config;
  },
  (error) => {
    console.log(`An Error has occurred: ${error.message}`);
    return Promise.reject(error);
  }
);

// billingClient (Response Interceptor)
billingClient.interceptors.response.use(
  (response) => {
    console.log(`- - - Response Log: billingClient`, response);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log(`401 An Error has occured: billingClient`, error.message);
      console.log("Unauthorized request. Redirecting to login...");
    }
    return Promise.reject(error);
  }
);

export default billingClient;

