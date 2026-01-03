import path from 'path';
import { pathToFileURL } from 'url';
import logger from '../utils/logger';

/**
 * Configuration options for creating a Codex thread
 */
export interface CodexThreadOptions {
  workingDirectory?: string;
  skipGitRepoCheck?: boolean;
  model?: string;
  approvalMode?: 'never' | 'on-request' | 'on-failure' | 'untrusted';
  sandboxMode?: 'read-only' | 'workspace-write' | 'danger-full-access';
  yoloMode?: boolean; // Convenience flag for danger-full-access + never approval
}

/**
 * Options for running a Codex prompt
 */
export interface CodexRunOptions {
  outputSchema?: object;
  model?: string;
}

/**
 * Event types from Codex streaming (from @openai/codex-sdk)
 */
export type CodexEventType =
  | 'thread.started'
  | 'turn.started'
  | 'turn.completed'
  | 'turn.failed'
  | 'item.started'
  | 'item.updated'
  | 'item.completed'
  | 'error';

/**
 * Codex streaming event (matches ThreadEvent from SDK)
 */
export interface CodexEvent {
  type: CodexEventType;
  thread_id?: string;  // For thread.started
  usage?: any;         // For turn.completed
  error?: any;         // For turn.failed and error events
  item?: any;          // For item.* events
  message?: string;    // For error events
  [key: string]: any;
}

/**
 * CodexService: Wrapper for OpenAI Codex SDK
 * Provides methods to create threads, run prompts, and stream responses
 */
export class CodexService {
  private codexPromise?: Promise<any>;
  private codexInstance?: any;
  private defaultWorkingDirectory: string;
  private environmentThreads: Map<string, any>; // Store threads by working directory

  /**
   * Initialize the Codex service
   * @param apiKey - OpenAI API key (optional, will use env var if not provided)
   * @param defaultWorkingDirectory - Default working directory for threads
   */
  constructor(
    apiKey?: string,
    defaultWorkingDirectory: string = process.cwd()
  ) {
    this.defaultWorkingDirectory = defaultWorkingDirectory;
    this.environmentThreads = new Map();

    logger.info('CodexService initialized');
  }

  private async initializeCodex() {
    const sdkPath = path.resolve(
      __dirname,
      '../../node_modules/@openai/codex-sdk/dist/index.js'
    );
    const specifier = pathToFileURL(sdkPath).href;
    const mod = await new Function('specifier', 'return import(specifier);')(
      specifier
    );
    return new mod.Codex();
  }

  private async getCodex() {
    if (!this.codexPromise) {
      this.codexPromise = this.initializeCodex();
    }

    if (!this.codexInstance) {
      this.codexInstance = await this.codexPromise;
    }

    return this.codexInstance;
  }

  /**
   * Create a new Codex thread
   * @param options - Thread configuration options
   * @returns Codex thread instance
   */
  async startThread(options: CodexThreadOptions = {}) {
    const {
      workingDirectory = this.defaultWorkingDirectory,
      skipGitRepoCheck = false,
      model = 'gpt-5-codex',
      approvalMode,
      sandboxMode,
      yoloMode = false,
    } = options;

    // If yoloMode is enabled, override approvalMode and sandboxMode
    const finalApprovalMode = yoloMode ? 'never' : approvalMode;
    const finalSandboxMode = yoloMode ? 'danger-full-access' : sandboxMode;

    logger.info('Starting Codex thread', {
      workingDirectory,
      skipGitRepoCheck,
      model,
      approvalMode: finalApprovalMode,
      sandboxMode: finalSandboxMode,
      yoloMode,
    });

    const threadOptions: any = {
      workingDirectory,
      skipGitRepoCheck,
      model,
    };

    // Add optional parameters if provided
    if (finalApprovalMode) {
      threadOptions.approvalMode = finalApprovalMode;
    }

    if (finalSandboxMode) {
      threadOptions.sandboxMode = finalSandboxMode;
    }

    const codex = await this.getCodex();
    const thread = codex.startThread(threadOptions);

    logger.info('Codex thread started successfully');

    return thread;
  }

  /**
   * Resume an existing Codex thread
   * @param threadId - ID of the thread to resume
   * @returns Codex thread instance
   */
  async resumeThread(threadId: string) {
    logger.info('Resuming Codex thread', { threadId });

    const codex = await this.getCodex();
    const thread = codex.resumeThread(threadId);

    logger.info('Codex thread resumed successfully', { threadId });

    return thread;
  }

  /**
   * Run a prompt on a thread and wait for completion
   * @param thread - Codex thread instance
   * @param prompt - Prompt to run
   * @param options - Run options
   * @returns Turn result with finalResponse and items
   */
  async run(thread: any, prompt: string, options: CodexRunOptions = {}) {
    logger.info('Running Codex prompt', { prompt, options });

    const runOptions: any = {};

    if (options.outputSchema) {
      runOptions.outputSchema = options.outputSchema;
    }

    if (options.model) {
      runOptions.model = options.model;
    }

    try {
      const turn = await thread.run(prompt, runOptions);

      logger.info('Codex prompt completed', {
        finalResponse: turn.finalResponse?.substring(0, 100),
        itemsCount: turn.items?.length,
      });

      return turn;
    } catch (error) {
      logger.error('Error running Codex prompt', { error, prompt });
      throw error;
    }
  }

  /**
   * Run a prompt with streaming responses
   * @param thread - Codex thread instance
   * @param prompt - Prompt to run
   * @param options - Run options
   * @returns Async generator of Codex events
   */
  async runStream(thread: any, prompt: string, options: CodexRunOptions = {}) {
    logger.info('Running Codex prompt with streaming', { prompt, options });

    const runOptions: any = {};

    if (options.outputSchema) {
      runOptions.outputSchema = options.outputSchema;
    }

    if (options.model) {
      runOptions.model = options.model;
    }

    try {
      const { events } = await thread.runStreamed(prompt, runOptions);

      logger.info('Codex streaming started');

      return events;
    } catch (error) {
      logger.error('Error running Codex stream', { error, prompt });
      throw error;
    }
  }

  /**
   * Run a prompt with streaming and handle events
   * @param thread - Codex thread instance
   * @param prompt - Prompt to run
   * @param onEvent - Callback for each event
   * @param options - Run options
   * @returns Final turn result
   */
  async runStreamWithHandler(
    thread: any,
    prompt: string,
    onEvent: (event: CodexEvent) => void | Promise<void>,
    options: CodexRunOptions = {}
  ) {
    const events = await this.runStream(thread, prompt, options);

    let finalTurn: any = null;

    for await (const event of events) {
      // Call the event handler
      await onEvent(event as CodexEvent);

      // Capture the final turn
      if (event.type === 'turn.completed') {
        finalTurn = event;
      }

      // Log important events
      switch (event.type) {
        case 'item.completed':
          logger.debug('Item completed', { item: event.item });
          break;
        case 'turn.completed':
          logger.info('Turn completed', { usage: event.usage });
          break;
        case 'response.delta':
          // Don't log deltas as they can be very frequent
          break;
        default:
          logger.debug('Codex event', { type: event.type });
      }
    }

    return finalTurn;
  }

  /**
   * Helper method to create a thread and run a prompt in one call
   * @param prompt - Prompt to run
   * @param threadOptions - Thread configuration options
   * @param runOptions - Run options
   * @returns Turn result
   */
  async quickRun(
    prompt: string,
    threadOptions: CodexThreadOptions = {},
    runOptions: CodexRunOptions = {}
  ) {
    const thread = await this.startThread(threadOptions);
    return await this.run(thread, prompt, runOptions);
  }

  /**
   * Helper method to create a thread and run a prompt with streaming
   * @param prompt - Prompt to run
   * @param onEvent - Callback for each event
   * @param threadOptions - Thread configuration options
   * @param runOptions - Run options
   * @returns Final turn result
   */
  async quickRunStream(
    prompt: string,
    onEvent: (event: CodexEvent) => void | Promise<void>,
    threadOptions: CodexThreadOptions = {},
    runOptions: CodexRunOptions = {}
  ) {
    const thread = await this.startThread(threadOptions);
    return await this.runStreamWithHandler(thread, prompt, onEvent, runOptions);
  }

  /**
   * Setup Codex environment for a specific working directory
   * Creates a thread in YOLO mode for automated theme editing
   *
   * @param workingDirectory - The directory where Codex will operate (theme directory)
   * @param model - Model to use (optional, will use default from config or env)
   * @returns Object containing thread, threadId, and working directory info
   */
  async setupEnvironment(workingDirectory: string, model?: string) {
    logger.info('Setting up Codex environment', {
      workingDirectory,
      model: model || 'default',
    });

    // Create thread with YOLO mode enabled
    // User will set API key on their own, so no API key validation here
    const thread = await this.startThread({
      workingDirectory,
      skipGitRepoCheck: false, // Enforce Git repo check as requested
      model: model || 'gpt-5.1-codex-max', // Default to gpt-5.1-codex-max
      yoloMode: true, // Enable YOLO mode (full access, no approvals)
    });

    // Generate a unique environment ID based on working directory
    const envId = workingDirectory.replace(/[^a-zA-Z0-9]/g, '_');

    // Store the thread for later access
    this.environmentThreads.set(envId, {
      thread,
      workingDirectory,
      model: model || 'gpt-5.1-codex-max',
      createdAt: new Date(),
    });

    logger.info('Codex environment setup complete', {
      envId,
      workingDirectory,
      model: model || 'gpt-5.1-codex-max',
      yoloMode: true,
    });

    return {
      thread,
      envId,
      workingDirectory,
      model: model || 'gpt-5.1-codex-max',
      yoloMode: true,
    };
  }

  /**
   * Get an existing environment thread by ID
   * @param envId - Environment ID
   * @returns Environment info or undefined if not found
   */
  getEnvironment(envId: string) {
    return this.environmentThreads.get(envId);
  }

  /**
   * List all active environment threads
   * @returns Array of environment info objects
   */
  listEnvironments() {
    return Array.from(this.environmentThreads.entries()).map(([envId, env]) => ({
      envId,
      ...env,
    }));
  }

  /**
   * Remove an environment thread
   * @param envId - Environment ID
   * @returns True if deleted, false if not found
   */
  removeEnvironment(envId: string): boolean {
    const deleted = this.environmentThreads.delete(envId);
    if (deleted) {
      logger.info('Removed Codex environment', { envId });
    }
    return deleted;
  }
}

export default CodexService;
