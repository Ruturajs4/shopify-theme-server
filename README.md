# Shopify Theme Server with Codex Integration

A powerful API server for managing Shopify themes with integrated OpenAI Codex support for automated theme editing.

## Features

✅ **Theme Management**
- Download and duplicate Shopify themes
- Automatic local setup
- Theme dev server integration

✅ **Codex Integration**
- Automatic environment setup after theme download
- Chat endpoints with webhook notifications
- Streaming and non-streaming modes
- YOLO mode for fully automated editing

✅ **Flexible API**
- RESTful endpoints
- Webhook-based async operations
- Server-Sent Events for streaming
- Environment management

✅ **Production Ready**
- TypeScript type safety
- Comprehensive error handling
- Detailed logging
- Full documentation

## Quick Start

### 1. Installation

```bash
cd shopify-theme-server
npm install
```

### 2. Configuration

Create a `.env` file:

```bash
# Shopify Configuration
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_THEME_PASSWORD=shpat_xxxxx

# Session & Webhook
SESSION_ID=your-session-id
WEBHOOK_URL=https://your-webhook-server.com
SERVICE_USERNAME=webhook-username
SERVICE_PASSWORD=webhook-password

# Codex Configuration (set by user)
OPENAI_API_KEY=sk-your-api-key-here
CODEX_MODEL=gpt-5.1-codex-max  # Optional, defaults to gpt-5.1-codex-max

# Optional
THEME_DOWNLOAD_PATH=/path/to/themes  # Default: ./themes
PORT=8000  # Default: 8000
```

### 3. Start Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 4. Download a Theme

```bash
curl -X POST http://localhost:8000/selected-theme \
  -H "Content-Type: application/json" \
  -d '{"theme_id": "123456789"}'
```

This will:
1. Duplicate the theme on Shopify
2. Download it to local directory
3. **Automatically setup Codex environment** ✨
4. Start theme dev server
5. Send webhook notification

### 5. Chat with Codex

```bash
# Send chat request
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "env_id": "themes_123456789",
    "prompt": "Add a newsletter signup section to the footer"
  }'
```

Result will be sent to your webhook: `{WEBHOOK_URL}/chat/{SESSION_ID}`

## API Endpoints

### Theme Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/selected-theme` | Download and setup theme |
| GET | `/health` | Health check |

### Chat Endpoints (Webhook-based)

| Method | Endpoint | Description | Webhook |
|--------|----------|-------------|---------|
| POST | `/chat` | Chat (non-streaming) | `/chat/{SESSION_ID}` |
| POST | `/chat-streaming` | Chat (streaming) | `/chat-streaming/{SESSION_ID}` |

### Environment Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/codex/environments` | List all environments |
| GET | `/api/codex/environment/:envId` | Get environment details |
| POST | `/api/codex/environment/:envId/run` | Run prompt on environment |
| DELETE | `/api/codex/environment/:envId` | Remove environment |

### Direct Codex Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/codex/thread` | Create thread |
| POST | `/api/codex/run` | Run prompt (sync) |
| POST | `/api/codex/stream` | Run prompt (SSE) |
| POST | `/api/codex/resume` | Resume thread |
| DELETE | `/api/codex/thread/:id` | Delete thread |
| GET | `/api/codex/threads` | List threads |
| POST | `/api/codex/quick-run` | Quick run |

See [API_ENDPOINTS_REFERENCE.md](./API_ENDPOINTS_REFERENCE.md) for complete details.

## Automatic Codex Setup

When you download a theme, Codex is **automatically configured** for that theme:

```typescript
// Happens automatically in downloadTheme()
const codexEnv = setupEnvironment(themePath, model);

// Creates:
{
  thread: CodexThread,           // Ready-to-use thread
  envId: "themes_123456789",     // Unique identifier
  workingDirectory: "/themes/123456789",
  model: "gpt-5.1-codex-max",    // From env or default
  yoloMode: true                 // Full access, no approvals
}
```

**Configuration:**
- ✅ Working Directory: Theme path
- ✅ YOLO Mode: Enabled (no approvals, full access)
- ✅ Model: From `CODEX_MODEL` env or `gpt-5.1-codex-max`
- ✅ Git Repo Check: Enforced (skipGitRepoCheck: false)

## Usage Examples

### Complete Workflow

```bash
# 1. Download theme
curl -X POST http://localhost:8000/selected-theme \
  -H "Content-Type: application/json" \
  -d '{"theme_id": "123456789"}'

# 2. Check environments
curl http://localhost:8000/api/codex/environments

# 3. Send chat request
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "env_id": "themes_123456789",
    "prompt": "Add a hero section to index.liquid"
  }'

# 4. Receive result at webhook endpoint
# {WEBHOOK_URL}/chat/{SESSION_ID}
```

### Webhook Receiver Example

```typescript
import express from 'express';

const app = express();
app.use(express.json());

// Receive chat results
app.post('/chat/:sessionId', (req, res) => {
  const payload = req.body;

  if (payload.success) {
    console.log('Response:', payload.response);
    console.log('Items:', payload.items);
    // Process the result
  } else {
    console.error('Error:', payload.error);
    // Handle error
  }

  res.json({ received: true });
});

app.listen(3000);
```

## Documentation

### Guides
- **[API Endpoints Reference](./API_ENDPOINTS_REFERENCE.md)** - Complete API documentation
- **[Chat Endpoints Guide](./CHAT_ENDPOINTS_GUIDE.md)** - Using /chat and /chat-streaming
- **[Setup Environment Guide](./SETUP_ENVIRONMENT_GUIDE.md)** - How automatic setup works
- **[Codex Service README](./CODEX_SERVICE_README.md)** - CodexService API reference

### Implementation Details
- **[Chat Implementation Summary](./CHAT_IMPLEMENTATION_SUMMARY.md)** - Chat endpoints implementation
- **[Codex Implementation Summary](./CODEX_IMPLEMENTATION_SUMMARY.md)** - Codex integration details

### Examples
- `src/examples/chat-endpoints.example.ts` - Chat endpoint examples
- `src/examples/codex-usage.example.ts` - Codex service examples
- `src/examples/setup-environment.example.ts` - Environment setup demo

## NPM Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build TypeScript
npm start                # Start production server

# Examples
npm run chat:examples    # Run chat endpoint examples
npm run codex:example    # Run Codex service examples
npm run codex:setup-demo # Demonstrate environment setup
npm run codex:test       # Run Codex service tests

# Other
npm run lint             # Lint TypeScript files
```

## Project Structure

```
shopify-theme-server/
├── src/
│   ├── config/
│   │   └── environment.ts          # Environment configuration
│   ├── routes/
│   │   ├── theme.routes.ts         # Theme management routes
│   │   ├── chat.routes.ts          # Chat endpoints
│   │   └── codex.routes.ts         # Direct Codex routes
│   ├── services/
│   │   ├── shopify.service.ts      # Shopify operations
│   │   ├── codex.service.ts        # Codex SDK wrapper
│   │   └── auth.service.ts         # Authentication
│   ├── types/
│   │   └── theme.types.ts          # TypeScript types
│   ├── utils/
│   │   └── logger.ts               # Winston logger
│   ├── examples/
│   │   ├── chat-endpoints.example.ts
│   │   ├── codex-usage.example.ts
│   │   └── setup-environment.example.ts
│   └── index.ts                    # Main server file
├── docs/                           # Documentation
├── package.json
├── tsconfig.json
└── .env                            # Environment variables
```

## Key Features Explained

### 1. Automatic Environment Setup

After downloading a theme, Codex is automatically configured:
- Thread created with YOLO mode
- Working directory set to theme path
- Model from env var or default
- Environment stored for easy access

### 2. Webhook-Based Chat

Chat endpoints return immediately and send results via webhook:
- `/chat` - Non-streaming, complete response
- `/chat-streaming` - Streaming, event-driven

### 3. YOLO Mode

YOLO mode means:
- No approval prompts
- Full filesystem access
- Fully automated editing

Equivalent to `--yolo` in Codex CLI.

### 4. Model Selection

Support for all Codex models:
- `gpt-5.1-codex-max` (default) - Maximum capability
- `gpt-5.1-codex` - Standard GPT-5.1
- `gpt-5-codex` - Standard GPT-5
- `gpt-5-codex-mini` - Faster, lighter

### 5. Environment Management

Track multiple theme environments:
- List all environments
- Get specific environment
- Run prompts on environments
- Remove when done

## Technologies

- **TypeScript** - Type-safe development
- **Express** - Web framework
- **@openai/codex-sdk** - Codex integration
- **Winston** - Logging
- **Axios** - HTTP client
- **Shopify CLI** - Theme operations

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `SHOPIFY_STORE_URL` | Your Shopify store URL | `store.myshopify.com` |
| `SHOPIFY_THEME_PASSWORD` | Theme access password | `shpat_xxxxx` |
| `SESSION_ID` | Unique session identifier | `session-123` |
| `WEBHOOK_URL` | Webhook notification URL | `https://webhook.com` |
| `SERVICE_USERNAME` | Webhook auth username | `username` |
| `SERVICE_PASSWORD` | Webhook auth password | `password` |
| `OPENAI_API_KEY` | OpenAI API key (user sets) | `sk-xxxxx` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `CODEX_MODEL` | Codex model to use | `gpt-5.1-codex-max` |
| `THEME_DOWNLOAD_PATH` | Theme download directory | `./themes` |
| `PORT` | Server port | `8000` |

## Troubleshooting

### Issue: Environment not created after theme download
**Solution:** Check that theme download completed successfully and Git repo is initialized.

### Issue: Webhook not received
**Solution:** Verify `WEBHOOK_URL`, `SESSION_ID`, and that webhook server is running.

### Issue: API key errors
**Solution:** Set `OPENAI_API_KEY` environment variable before starting server.

### Issue: Theme download fails
**Solution:** Verify Shopify credentials and store URL are correct.

## Development

### Running Tests

```bash
npm run codex:test
```

### Adding New Endpoints

1. Create route handler in `src/routes/`
2. Add types to `src/types/theme.types.ts`
3. Register route in `src/index.ts`
4. Create examples and documentation

### Contributing

1. Follow TypeScript best practices
2. Add comprehensive error handling
3. Include logging statements
4. Document new features
5. Create usage examples

## License

ISC

## Support

For issues or questions:
- Check documentation in `/docs` and markdown files
- Review examples in `src/examples/`
- See implementation summaries for details

## Summary

**Shopify Theme Server** provides a complete solution for automated theme management with Codex integration:

✅ Download Shopify themes automatically
✅ Codex setup happens automatically after download
✅ Chat with Codex via webhook-based endpoints
✅ Full environment management
✅ YOLO mode for automation
✅ Production-ready with comprehensive docs

**Get started in 3 steps:**
1. Configure environment variables
2. Start server: `npm run dev`
3. Download a theme and start chatting with Codex!
