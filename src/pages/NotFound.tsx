import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scissors, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Scissors className="h-16 w-16 text-primary mb-6 animate-pulse" />
      <h1 className="font-display text-6xl font-bold text-foreground mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Página não encontrada</p>
      <Link to="/">
        <Button variant="gold" size="lg">
          <Home className="h-4 w-4 mr-2" />
          Voltar ao Início
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
