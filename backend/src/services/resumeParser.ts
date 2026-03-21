import axios from 'axios';
import FormData from 'form-data';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { IParsedData } from '../models/Resume';

export interface ParseResumeResponse {
  status: string;
  data: IParsedData;
}

/**
 * Calls the live resume parser API with a file buffer.
 * Returns structured parsed resume data.
 */
export async function parseResumeFromBuffer(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<IParsedData> {
  const formData = new FormData();
  formData.append('file', buffer, {
    filename,
    contentType: mimetype,
  });
  formData.append('use_openai', 'true');

  logger.info(`Calling resume parser API for file: ${filename}`);

  try {
    const response = await axios.post<ParseResumeResponse>(
      `${env.RESUME_PARSER_URL}/parse_resume`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60s — LLM parsing can be slow
      }
    );

    if (response.data.status !== 'success' && response.data.status !== 'ok') {
      throw new Error(`Parser API returned status: ${response.data.status}`);
    }

    logger.info(`Resume parsed successfully: ${filename}`);
    return response.data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.error || err.message;
      logger.error(`Resume parser API error: ${msg}`);
      throw new Error(`Resume parser failed: ${msg}`);
    }
    throw err;
  }
}
