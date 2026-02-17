import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={<MapPin className="h-12 w-12" />}
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        action={
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        }
      />
    </div>
  );
}
