# MCP Client Setup Guide

## Overview

This is a MCP (Model Context Protocol) Client application that provides a web-based interface for connecting to remote MCP servers and executing tools with an integrated AI-powered chat agent.

## Features

- **AI Chat Interface**: Powered by local Ollama LLM (llama3.2:1b model)
- **Service Integration**: GitHub, Jira, Confluence, Slack, and database connections
- **Tool Management**: Manual and AI-powered tool execution with permission controls
- **Responsive Design**: Modern UI with dark/light mode support
- **Real-time Communication**: Live chat with AI assistance

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Ollama (for local AI functionality)

## Installation Steps

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd mcp-client

# Install dependencies
npm install
```

### 2. Set Up Ollama (Local AI)

#### Install Ollama
```bash
# macOS
brew install ollama

# Linux/Windows
curl -fsSL https://ollama.com/install.sh | sh
```

#### Pull the Required Model
```bash
ollama pull llama3.2:1b
```

#### Start Ollama Server
```bash
ollama serve
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
LOCAL_LLM_API_KEY=ollama
LOCAL_LLM_BASE_URL=http://localhost:11434
LOCAL_LLM_MODEL=llama3.2:1b
```

#### For Replit Users (Cloud Environment)

Since Replit runs in the cloud, you need to expose your local Ollama using ngrok:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/download

# Create tunnel to local Ollama
ngrok http 11434

# Update .env with the ngrok URL
LOCAL_LLM_BASE_URL=https://your-ngrok-url.ngrok.io
```

### 4. Run the Application

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:5000`

#### Windows Users: NODE_ENV Error Fix
If you encounter the error `'NODE_ENV' is not recognized as an internal or external command`, this is normal! The project uses `cross-env` to handle environment variables across different operating systems automatically. Just run `npm run dev` and it will work correctly.

## Common Installation Issues

### Issue: NODE_ENV not recognized (Windows)
**Solution:** This is automatically handled by the `cross-env` package. The error message is expected on Windows, but the application will still run correctly.

### Issue: Port 5000 already in use
**Solution:** 
1. Stop any other processes using port 5000
2. Or modify the port in `server/index.ts` if needed

### Issue: Tools not refreshing when switching tabs
**Solution:** This has been fixed! Tools now automatically refresh when you switch between MCP server tabs.

### Issue: AI showing wrong tools for selected server
**Solution:** The AI now correctly filters tools based on the selected MCP server tab.

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility libraries
├── server/               # Backend Express server
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage interface
│   └── index.ts          # Server entry point
├── shared/               # Shared TypeScript schemas
└── .env                  # Environment configuration
```

## Usage

### Chat Interface

1. Select the "Local LLM (Ollama)" model from the dropdown
2. Type messages in the chat input
3. AI responses are powered by your local llama3.2:1b model

### Service Management

1. Navigate to service tabs (GitHub, Jira, etc.)
2. Configure server connections and authentication
3. Select tools and permissions
4. Use either manual execution or AI-assisted workflows

### Tool Permissions

- **Low Risk**: Automatically approved
- **Medium Risk**: User confirmation required
- **High Risk**: Explicit approval with warning dialog

## Troubleshooting

### Chat Not Working

1. Ensure Ollama is running: `ollama serve`
2. Verify model is installed: `ollama list`
3. Check ngrok tunnel (for Replit users)
4. Review console logs for connection errors

### Common Issues

- **Port conflicts**: Change port in environment variables
- **Model not found**: Run `ollama pull llama3.2:1b`
- **Connection refused**: Verify Ollama server is running

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOCAL_LLM_BASE_URL` | Ollama server URL | `http://localhost:11434` |
| `LOCAL_LLM_MODEL` | AI model name | `llama3.2:1b` |
| `LOCAL_LLM_API_KEY` | API key (for Ollama use "ollama") | `ollama` |
| `PORT` | Server port | `5000` |

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run type-check   # Run TypeScript checks
```

### Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Ollama (local LLM)
- **Build Tool**: Vite

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]

## Support

For issues and questions:
- Check the troubleshooting section
- Review console logs for errors
- Ensure all prerequisites are installed correctly