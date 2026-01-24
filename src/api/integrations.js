import { integrations } from './services/integrationService';

export const Core = integrations.Core;
export const UploadFile = integrations.Core.UploadFile;
export const InvokeLLM = integrations.Core.InvokeLLM;
export const SendEmail = integrations.Core.SendEmail;
// Export others as needed or remove if unused

export default {
  Core,
  UploadFile,
  InvokeLLM,
  SendEmail
};
