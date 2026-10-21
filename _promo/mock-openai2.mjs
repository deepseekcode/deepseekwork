// 宣传录制用 mock OpenAI 端点：流式返回一段固定脚本（reading -> grep -> 结论）。
// 只用于本地录屏，不联网、不花钱、不含任何真实 key。
// 用法: node mock-openai.mjs [port]
import { createServer } from 'node:http';

const PORT = Number(process.argv[2] || process.env.MOCK_PORT || 3199);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function chunk(delta, finish = null) {
  return `data: ${JSON.stringify({
    id: 'chatcmpl-promo',
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: 'promo-model',
    choices: [{ index: 0, delta, finish_reason: finish }],
  })}\n\n`;
}

/** 把一段文本切成小片，模拟打字机效果。 */
function slices(text, size = 12) {
  const out = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

const FINAL = `Found it. \`src/api.ts\` spreads \`RetryOptions\` into \`RequestInit\`, so \`retries\` and \`baseDelayMs\` are handed to \`fetch\` and silently ignored — the loop then re-throws on the first 5xx instead of backing off.

\`\`\`diff
- const opts = { ...DEFAULTS, ...(init as RetryOptions) };
- for (let attempt = 0; attempt <= opts.retries; attempt++) {
+ const { retries, baseDelayMs, shouldRetry } = { ...DEFAULTS, ...options };
+ for (let attempt = 0; attempt <= retries; attempt++) {
\`\`\`

Both callers in \`src/client.ts\` pass plain objects, so the new signature stays backwards compatible.`;

const SCRIPT = [
  {
    content: 'Reading the retry path first.\n\n',
    toolCalls: [{ id: 'call_read_1', name: 'read_file', args: { file_path: 'src/api.ts' } }],
  },
  {
    content: 'Now every place that depends on those option names.\n\n',
    toolCalls: [{ id: 'call_grep_1', name: 'grep', args: { pattern: 'retr|baseDelay', path: 'src' } }],
  },
  {
    content: FINAL,
    toolCalls: [],
  },
];

function turnIndex(messages) {
  const assistantTurns = messages.filter((m) => m && m.role === 'assistant').length;
  return Math.min(assistantTurns, SCRIPT.length - 1);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (url.pathname.endsWith('/models')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ object: 'list', data: [{ id: 'promo-model', object: 'model' }] }));
    return;
  }

  if (!url.pathname.endsWith('/chat/completions')) {
    res.writeHead(404);
    res.end('not found');
    return;
  }

  let body = '';
  for await (const part of req) body += part;
  let payload = {};
  try { payload = JSON.parse(body); } catch { /* ignore */ }
  const step = SCRIPT[turnIndex(Array.isArray(payload.messages) ? payload.messages : [])];
  console.log(`[promo-mock] turn -> ${SCRIPT.indexOf(step)}`);

  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });

  await sleep(420);
  for (const piece of slices(step.content)) {
    res.write(chunk({ content: piece }));
    await sleep(22);
  }

  for (const [i, call] of step.toolCalls.entries()) {
    res.write(chunk({
      tool_calls: [{
        index: i,
        id: call.id,
        type: 'function',
        function: { name: call.name, arguments: JSON.stringify(call.args) },
      }],
    }));
    await sleep(160);
  }

  res.write(chunk({}, step.toolCalls.length ? 'tool_calls' : 'stop'));
  res.write('data: [DONE]\n\n');
  res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[promo-mock] http://127.0.0.1:${PORT}/v1`);
});
