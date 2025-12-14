import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scissors, Crown, Clock, Star } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a853' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12 lg:px-20">
          <div className="flex items-center gap-2">
            <Scissors className="h-8 w-8 text-primary" />
            <span className="font-display text-2xl font-bold text-foreground">BarberPro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/cliente/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/admin/login">
              <Button variant="outline" size="sm">Área Admin</Button>
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:px-12 lg:px-20 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 mb-6">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">Experiência Premium</span>
              </div>
              <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
                A Arte do
                <span className="block text-gradient-gold">Corte Perfeito</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-lg">
                Reserve seu horário com os melhores barbeiros da cidade. 
                Experiência única, ambiente sofisticado e resultados impecáveis.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/cliente/login">
                  <Button variant="gold" size="xl">
                    Agendar Agora
                  </Button>
                </Link>
                <Link to="/admin/login">
                  <Button variant="outline" size="xl">
                    Sou Barbeiro
                  </Button>
                </Link>
              </div>
              <div className="mt-12 flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="text-sm text-muted-foreground">4.9/5 Avaliações</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Agendamento 24h</span>
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="rounded-2xl bg-gradient-card border border-border p-6 shadow-card hover:border-primary/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Scissors className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">Cortes Exclusivos</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Técnicas modernas e tradicionais para todos os estilos
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-card border border-border p-6 shadow-card hover:border-primary/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">Barbeiros Premium</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Profissionais experientes e certificados
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-card border border-border p-6 shadow-card hover:border-primary/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">Agendamento Fácil</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Escolha seu horário preferido em segundos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </header>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-semibold text-foreground">BarberPro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 BarberPro. Sistema de agendamento para barbearias.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
