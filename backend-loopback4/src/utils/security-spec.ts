import {SecuritySchemeObject} from '@loopback/rest';

export const SECURITY_SCHEME_SPEC: Record<string, SecuritySchemeObject> = {
  jwt: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  },
};