/**
 * Codex API Routes
 *
 * This file demonstrates how to integrate CodexService with Express routes
 * to provide Codex functionality via REST API.
 */

import { Router, Request, Response } from 'express';
import codexService from '../services/codex.instance';
import logger from '../utils/logger';

const router = Router();

// Store active threads (in production, use a database)
const activeThreads = new Map<string, any>();

/**
 * POST /codex/thread
 * Create a new Codex thread
 */
router.post('/codex/thread', async (req: Request, res: Response) => {
  try {
    const {
      workingDirectory,
      skipGitRepoCheck = true,
      model = 'gpt-5-codex',
      yoloMode = false,
      approvalMode,
      sandboxMode,
    } = req.body;

    logger.info('Creating new Codex thread', {
      workingDirectory,
      model,
      yoloMode,
    });

    const thread = await codexService.startThread({
      workingDirectory,
      skipGitRepoCheck,
      model,
      yoloMode,
      approvalMode,
      sandboxMode,
    });

    // Generate a thread ID (in production, use UUID)
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the thread
    activeThreads.set(threadId, thread);

    res.json({
      success: true,
      threadId,
      config: {
        workingDirectory,
        skipGitRepoCheck,
        model,
        yoloMode,
        approvalMode,
        sandboxMode,
      },
    });
  } catch (error) {
    logger.error('Error creating Codex thread', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create thread',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /codex/run
 * Run a prompt on a thread
 */
router.post('/codex/run', async (req: Request, res: Response) => {
  try {
    const { threadId, prompt, model, outputSchema } = req.body;

    if (!threadId || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: threadId and prompt',
      });
    }

    const thread = activeThreads.get(threadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found',
      });
    }

    logger.info('Running Codex prompt', { threadId, prompt: prompt.substring(0, 50) });

    const turn = await codexService.run(thread, prompt, {
      model,
      outputSchema,
    });

    res.json({
      success: true,
      threadId,
      response: turn.finalResponse,
      items: turn.items,
    });
  } catch (error) {
    logger.error('Error running Codex prompt', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to run prompt',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /codex/stream
 * Run a prompt with streaming (uses Server-Sent Events)
 */
router.post('/codex/stream', async (req: Request, res: Response) => {
  try {
    const { threadId, prompt, model } = req.body;

    if (!threadId || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: threadId and prompt',
      });
    }

    const thread = activeThreads.get(threadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found',
      });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    logger.info('Starting Codex stream', { threadId, prompt: prompt.substring(0, 50) });

    const events = await codexService.runStream(thread, prompt, { model });

    for await (const event of events) {
      // Send event to client
      res.write(`data: ${JSON.stringify(event)}\n\n`);

      // Log important events
      if (event.type === 'turn.completed') {
        logger.info('Codex stream completed', { threadId });
      }
    }

    res.end();
  } catch (error) {
    logger.error('Error streaming Codex prompt', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to stream prompt',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /codex/resume
 * Resume an existing thread
 */
router.post('/codex/resume', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: sessionId',
      });
    }

    logger.info('Resuming Codex thread', { sessionId });

    const thread = await codexService.resumeThread(sessionId);

    // Generate a new thread ID for this session
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the resumed thread
    activeThreads.set(threadId, thread);

    res.json({
      success: true,
      threadId,
      sessionId,
    });
  } catch (error) {
    logger.error('Error resuming Codex thread', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to resume thread',
      message: (error as Error).message,
    });
  }
});

/**
 * DELETE /codex/thread/:threadId
 * Delete a thread from active threads
 */
router.delete('/codex/thread/:threadId', (req: Request, res: Response) => {
  const { threadId } = req.params;

  if (activeThreads.has(threadId)) {
    activeThreads.delete(threadId);
    logger.info('Deleted Codex thread', { threadId });

    res.json({
      success: true,
      message: 'Thread deleted',
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Thread not found',
    });
  }
});

/**
 * GET /codex/threads
 * List all active threads
 */
router.get('/codex/threads', (req: Request, res: Response) => {
  const threads = Array.from(activeThreads.keys());

  res.json({
    success: true,
    threads,
    count: threads.length,
  });
});

/**
 * GET /codex/environments
 * List all Codex environments (theme directories)
 */
router.get('/codex/environments', (req: Request, res: Response) => {
  try {
    const environments = codexService.listEnvironments();

    res.json({
      success: true,
      environments: environments.map((env) => ({
        envId: env.envId,
        workingDirectory: env.workingDirectory,
        model: env.model,
        createdAt: env.createdAt,
      })),
      count: environments.length,
    });
  } catch (error) {
    logger.error('Error listing environments', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list environments',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /codex/environment/:envId
 * Get specific environment details
 */
router.get('/codex/environment/:envId', (req: Request, res: Response) => {
  try {
    const { envId } = req.params;
    const environment = codexService.getEnvironment(envId);

    if (!environment) {
      return res.status(404).json({
        success: false,
        error: 'Environment not found',
      });
    }

    res.json({
      success: true,
      environment: {
        envId,
        workingDirectory: environment.workingDirectory,
        model: environment.model,
        createdAt: environment.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error getting environment', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get environment',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /codex/environment/:envId/run
 * Run a prompt on a specific environment
 */
router.post('/codex/environment/:envId/run', async (req: Request, res: Response) => {
  try {
    const { envId } = req.params;
    const { prompt, model } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: prompt',
      });
    }

    const environment = codexService.getEnvironment(envId);
    if (!environment) {
      return res.status(404).json({
        success: false,
        error: 'Environment not found',
      });
    }

    logger.info('Running prompt on environment', { envId, prompt: prompt.substring(0, 50) });

    const turn = await codexService.run(environment.thread, prompt, { model });

    res.json({
      success: true,
      envId,
      response: turn.finalResponse,
      items: turn.items,
    });
  } catch (error) {
    logger.error('Error running prompt on environment', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to run prompt',
      message: (error as Error).message,
    });
  }
});

/**
 * DELETE /codex/environment/:envId
 * Remove an environment
 */
router.delete('/codex/environment/:envId', (req: Request, res: Response) => {
  try {
    const { envId } = req.params;
    const deleted = codexService.removeEnvironment(envId);

    if (deleted) {
      res.json({
        success: true,
        message: 'Environment removed',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Environment not found',
      });
    }
  } catch (error) {
    logger.error('Error removing environment', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to remove environment',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /codex/quick-run
 * Quick run: Create thread, run prompt, and return result
 */
router.post('/codex/quick-run', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      workingDirectory,
      skipGitRepoCheck = true,
      model = 'gpt-5-codex',
      yoloMode = false,
      outputSchema,
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: prompt',
      });
    }

    logger.info('Quick run Codex prompt', { prompt: prompt.substring(0, 50) });

    const turn = await codexService.quickRun(
      prompt,
      {
        workingDirectory,
        skipGitRepoCheck,
        model,
        yoloMode,
      },
      {
        outputSchema,
      }
    );

    res.json({
      success: true,
      response: turn.finalResponse,
      items: turn.items,
    });
  } catch (error) {
    logger.error('Error in quick run', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to run prompt',
      message: (error as Error).message,
    });
  }
});

export default router;
