import axios from "axios";
import { toast } from "react-hot-toast";
import { redirect } from "next/navigation";
import config from "@/config";
import {
  convertResponseToCurrency,
  convertRequestPayload,
  hasTypeDiscriminator,
} from "@/types/monetary";

// use this to interact with our own API (/app/api folder) from the front-end side
// See https://shipfa.st/docs/tutorials/api-call
const apiClient = axios.create({
  baseURL: "/api",
});

// Request interceptor - convert currency to cents before sending
apiClient.interceptors.request.use(
  function (config) {
    // Only convert POST, PUT, PATCH requests with data
    if (
      config.data &&
      (config.method === "post" ||
        config.method === "put" ||
        config.method === "patch")
    ) {
      const url = config.url || "";
      config.data = convertRequestPayload(url, config.data);
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

// Response interceptor - convert cents to currency after receiving
apiClient.interceptors.response.use(
  function (response) {
    const data = response.data;

    // Auto-convert monetary values if response has type discriminator
    if (hasTypeDiscriminator(data)) {
      return convertResponseToCurrency(data, data.__type);
    }

    // Handle array of typed responses
    if (
      Array.isArray(data) &&
      data.length > 0 &&
      hasTypeDiscriminator(data[0])
    ) {
      return data.map((item) => convertResponseToCurrency(item, item.__type));
    }

    // Handle wrapped arrays (e.g., { expenses: [...] })
    if (data && typeof data === "object" && !Array.isArray(data)) {
      for (const key in data) {
        const value = data[key];
        if (
          Array.isArray(value) &&
          value.length > 0 &&
          hasTypeDiscriminator(value[0])
        ) {
          data[key] = value.map((item) =>
            convertResponseToCurrency(item, item.__type),
          );
        }
      }
    }

    return data;
  },
  function (error) {
    return Promise.reject(error);
  },
);

export default apiClient;
