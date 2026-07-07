import { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Skeleton,
} from '@mui/material';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { evaluationApi } from '../api';

const DEFAULT_RUBRIC = `Introduction is present
Explains the main concept clearly
Includes at least two supporting points
Uses a conclusion or summary
Has relevant terminology`;

function parseFeedback(text) {
  if (!text) return [];
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

export default function ScriptEvaluator() {
  const [file, setFile] = useState(null);
  const [rubric, setRubric] = useState(DEFAULT_RUBRIC);
  const [maxMarks, setMaxMarks] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  
  // History states
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fileLabel = useMemo(() => {
    if (!file) {
      return 'No file selected';
    }
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.name} · ${sizeMb} MB`;
  }, [file]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await evaluationApi.history();
      setHistoryList(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setError('');
    setSelectedId(null);
  };

  const resetForm = () => {
    setFile(null);
    setRubric(DEFAULT_RUBRIC);
    setMaxMarks(100);
    setLoading(false);
    setError('');
    setResult(null);
    setSelectedId(null);
  };

  const runEvaluation = async () => {
    if (!file) {
      setError('Upload a PDF or image file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('rubric', rubric);
      formData.append('maxMarks', String(maxMarks));

      const { data } = await evaluationApi.evaluate(formData);
      setResult(data);
      setSelectedId(data._id);
      loadHistory(); // refresh history list
    } catch (thrownError) {
      setError(thrownError.response?.data?.error || thrownError.message || 'Evaluation failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectHistoryItem = async (id) => {
    setLoading(true);
    setError('');
    setResult(null);
    setSelectedId(id);
    
    try {
      const { data } = await evaluationApi.getById(id);
      setResult(data);
      // Synchronize inputs with saved history
      setRubric(data.answerKey?.questions?.map(q => q.rubric || q.questionText).join('\n') || '');
      setMaxMarks(data.totalMax || 100);
      setFile(null); // clear file input since we are viewing history
    } catch (err) {
      setError('Failed to fetch details for this evaluation.');
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      {/* Header Panel */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(13, 148, 136, 0.15) 100%)',
          border: '1px solid rgba(20, 184, 166, 0.15)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          color: '#e5eef8',
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <MenuBookRoundedIcon sx={{ color: '#14b8a6', fontSize: 36 }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              AI Answer Book Evaluator
            </Typography>
          </Stack>
          <Typography sx={{ color: 'text.secondary', maxWidth: 800, fontSize: '1.05rem' }}>
            Upload handwritten exam paper booklets, transcribe them with **SimpleHTR**, and grade them against rubric rules. Past results are saved and managed below.
          </Typography>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Evaluation History */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 400 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <HistoryRoundedIcon sx={{ color: '#14b8a6' }} />
                <Typography variant="h6">Past Papers</Typography>
              </Stack>
              <IconButton size="small" onClick={loadHistory} disabled={historyLoading}>
                <RefreshRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1.5 }} />

            {historyLoading ? (
              <Stack spacing={1}>
                {[1, 2, 3, 4].map(n => (
                  <Skeleton key={n} variant="rectangular" height={56} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }} />
                ))}
              </Stack>
            ) : historyList.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No past papers evaluated yet.
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0, overflowY: 'auto', flexGrow: 1, maxHeight: 550 }}>
                {historyList.map((item) => {
                  const isSelected = item._id === selectedId;
                  const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <ListItemButton
                      key={item._id}
                      selected={isSelected}
                      onClick={() => selectHistoryItem(item._id)}
                      sx={{
                        borderRadius: 2,
                        mb: 1.25,
                        border: '1px solid',
                        borderColor: isSelected ? 'primary.main' : 'rgba(255, 255, 255, 0.04)',
                        backgroundColor: isSelected ? 'rgba(20, 184, 166, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: isSelected ? 'primary.main' : 'rgba(20, 184, 166, 0.3)',
                          backgroundColor: isSelected ? 'rgba(20, 184, 166, 0.12)' : 'rgba(255,255,255,0.04)',
                        },
                      }}
                    >
                      <ListItemText
                        primary={item.originalName}
                        secondary={`${dateStr} · score: ${item.totalAwarded}/${item.totalMax}`}
                        primaryTypographyProps={{
                          noWrap: true,
                          sx: { fontWeight: isSelected ? 700 : 500, fontSize: '0.9rem', color: isSelected ? '#14b8a6' : '#f8fafc' },
                        }}
                        secondaryTypographyProps={{ sx: { fontSize: '0.75rem', color: '#94a3b8' } }}
                      />
                      <ChevronRightRoundedIcon sx={{ fontSize: 18, color: isSelected ? '#14b8a6' : '#475569' }} />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Middle Column: Upload & Rubric Input */}
        <Grid item xs={12} md={4.5}>
          <Stack spacing={3}>
            {/* Upload Paper Card */}
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h6">Upload Student Script</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Select a handwritten exam booklet (PDF, JPEG, or PNG).
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 3,
                    border: '1px dashed rgba(20, 184, 166, 0.25)',
                    borderRadius: 3,
                    bgcolor: 'rgba(2, 6, 23, 0.25)',
                    textAlign: 'center',
                    transition: 'all 0.25s',
                    '&:hover': {
                      borderColor: '#14b8a6',
                      bgcolor: 'rgba(2, 6, 23, 0.45)',
                    },
                  }}
                >
                  <input hidden id="file-uploader" type="file" accept="application/pdf,image/*" onChange={handleFileChange} />
                  <label htmlFor="file-uploader">
                    <Stack spacing={1.5} alignItems="center" sx={{ cursor: 'pointer' }}>
                      <UploadFileRoundedIcon sx={{ color: '#14b8a6', fontSize: 44 }} />
                      <Typography variant="subtitle1" sx={{ color: '#f8fafc' }}>
                        {file ? 'Replace Booklet' : 'Choose Exam File'}
                      </Typography>
                    </Stack>
                  </label>
                  <Typography variant="body2" sx={{ color: file ? '#38bdf8' : 'text.secondary', mt: 1.5, wordBreak: 'break-all' }}>
                    {fileLabel}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Rubric Definition Card */}
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h6">Grading Rubric</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Enter one evaluation rule/rubric point per line.
                  </Typography>
                </Box>
                <TextField
                  multiline
                  minRows={7}
                  maxRows={10}
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                  fullWidth
                  placeholder="e.g. Explains concept of photosynthesis"
                  sx={{ bgcolor: 'rgba(15, 23, 42, 0.5)' }}
                />
                <TextField
                  label="Maximum Total Marks"
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value) || 0)}
                  fullWidth
                />
                
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RateReviewRoundedIcon />}
                    onClick={runEvaluation}
                    disabled={loading}
                    fullWidth
                    sx={{ height: 48 }}
                  >
                    {loading ? 'Evaluating Booklet...' : 'Run Evaluation'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    startIcon={<RestartAltRoundedIcon />}
                    disabled={loading}
                    sx={{ px: 3, height: 48 }}
                  >
                    Reset
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column: Results & Extracted text */}
        <Grid item xs={12} md={4.5}>
          <Stack spacing={3}>
            {/* Score & Feedback Results Card */}
            <Paper sx={{ p: 3, minHeight: 450 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Grading Outcome
              </Typography>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2.5 }} />

              {error ? (
                <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
              ) : loading ? (
                <Stack spacing={3} sx={{ py: 4 }}>
                  <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
                  <Skeleton variant="text" height={40} width="60%" />
                  <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
                </Stack>
              ) : result ? (
                <Stack spacing={3.5}>
                  {/* Score Card */}
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: 'rgba(20, 184, 166, 0.08)',
                      border: '1px solid rgba(20, 184, 166, 0.25)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="overline" sx={{ color: '#14b8a6', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                      TOTAL GRADE
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, my: 1, color: '#f8fafc' }}>
                      {result.totalAwarded} <Typography component="span" variant="h5" sx={{ color: 'text.secondary' }}>/ {result.totalMax}</Typography>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {result.percentage}% criteria satisfied
                    </Typography>
                  </Box>

                  {/* Feedback Bullets */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 1.5, color: '#f8fafc' }}>
                      Evaluation Notes
                    </Typography>
                    <Stack spacing={1.25}>
                      {parseFeedback(result.feedback).map((line, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.5 }}>{line}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {/* Matched Criteria */}
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <CheckCircleOutlineRoundedIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ color: '#f8fafc' }}>
                        Matched Criteria
                      </Typography>
                    </Stack>
                    {!result.matchedCriteria || result.matchedCriteria.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary', pl: 1 }}>
                        No criteria matched.
                      </Typography>
                    ) : (
                      <Stack direction="row" flexWrap="wrap" gap={1.25}>
                        {result.matchedCriteria.map((item) => (
                          <Chip
                            key={item}
                            label={item}
                            sx={{
                              bgcolor: 'rgba(16, 185, 129, 0.15)',
                              color: '#6ee7b7',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              borderRadius: 2,
                            }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  {/* Missing Criteria */}
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <HighlightOffRoundedIcon sx={{ color: 'error.main', fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ color: '#f8fafc' }}>
                        Missing Criteria
                      </Typography>
                    </Stack>
                    {!result.missingCriteria || result.missingCriteria.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary', pl: 1 }}>
                        No missing criteria.
                      </Typography>
                    ) : (
                      <Stack spacing={1.25}>
                        {result.missingCriteria.map((item) => (
                          <Box
                            key={item}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.18)',
                            }}
                          >
                            <Typography variant="body2" sx={{ color: '#fca5a5' }}>{item}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              ) : (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    Upload a booklet or select a past evaluated paper to view grading outcomes.
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Extracted Text Output */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                SimpleHTR Extracted Text
              </Typography>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />
              {loading ? (
                <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
              ) : (
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    minHeight: 120,
                    maxHeight: 250,
                    borderRadius: 2,
                    bgcolor: 'rgba(2, 6, 23, 0.45)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                  }}
                >
                  {result?.extractedText || 'No text extracted yet.'}
                </Box>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}