import axios from 'axios';

export const httpClient = axios.create({
  baseURL: 'https://httpbin.org',
  timeout: 15_000,
});

