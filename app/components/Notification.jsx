import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function Notification({ open, message, severity = 'info', onClose, ...props }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      {...props}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%', color: 'white' }} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
}
