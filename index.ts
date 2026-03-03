/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '@google/genai';
import {marked} from 'marked';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function debug(...args: string[]) {
  const turn = document.createElement('div');
  const promises = args.map(async (arg) => await marked.parse(arg ?? ''));
  const strings = await Promise.all(promises);
  turn.innerHTML = strings.join('');
  document.body.append(turn);
}

async function generateContentFrom() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});

  debug('Generating...');

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents:
      'What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50.',
    config: {
      tools: [{codeExecution: {}}],
    },
  });

  await debug('```' + response.executableCode + '```');
  await debug(response.codeExecutionResult);
}

async function main() {
  await generateContentFrom().catch(async (e) => await debug('got error', e));
}

main();
