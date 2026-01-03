import CodexService from './codex.service';

// Shared CodexService instance so environments are consistent across routes/services.
const codexService = new CodexService();

export default codexService;
