import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Scissors,
  LogOut,
  Calendar,
  Clock,
  User,
  Users,
  Settings,
  Bell,
  Plus,
  X,
  Check,
  Trash2,
  Edit,
} from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  client_name: string;
  client_email: string;
  barbers: { name: string } | null;
  services: { name: string; price: number } | null;
}

interface Barber {
  id: string;
  name: string;
  photo_url: string | null;
  work_start_time: string;
  work_end_time: string;
  work_days: number[];
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

type Tab = 'appointments' | 'barbers' | 'services';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [barberForm, setBarberForm] = useState({ name: '', photo_url: '', work_start_time: '09:00', work_end_time: '18:00' });
  const [serviceForm, setServiceForm] = useState({ name: '', price: '', duration_minutes: '30' });
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchAppointments(), fetchBarbers(), fetchServices(), fetchNotifications()]);
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast({
            title: 'Novo Agendamento!',
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        client_name,
        client_email,
        barbers (name),
        services (name, price)
      `)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (data) setAppointments(data as Appointment[]);
  };

  const fetchBarbers = async () => {
    const { data } = await supabase.from('barbers').select('*').order('name');
    if (data) setBarbers(data);
  };

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').order('name');
    if (data) setServices(data);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const handleAddBarber = async () => {
    if (!barberForm.name) return;

    const { error } = await supabase.from('barbers').insert({
      name: barberForm.name,
      photo_url: barberForm.photo_url || null,
      work_start_time: barberForm.work_start_time,
      work_end_time: barberForm.work_end_time,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Barbeiro adicionado' });
      setBarberForm({ name: '', photo_url: '', work_start_time: '09:00', work_end_time: '18:00' });
      setDialogOpen(false);
      fetchBarbers();
    }
  };

  const handleUpdateBarber = async () => {
    if (!editingBarber) return;

    const { error } = await supabase
      .from('barbers')
      .update({
        name: barberForm.name,
        photo_url: barberForm.photo_url || null,
        work_start_time: barberForm.work_start_time,
        work_end_time: barberForm.work_end_time,
      })
      .eq('id', editingBarber.id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Barbeiro atualizado' });
      setEditingBarber(null);
      setBarberForm({ name: '', photo_url: '', work_start_time: '09:00', work_end_time: '18:00' });
      setDialogOpen(false);
      fetchBarbers();
    }
  };

  const handleDeleteBarber = async (id: string) => {
    const { error } = await supabase.from('barbers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Barbeiro removido' });
      fetchBarbers();
    }
  };

  const handleAddService = async () => {
    if (!serviceForm.name || !serviceForm.price) return;

    const { error } = await supabase.from('services').insert({
      name: serviceForm.name,
      price: parseFloat(serviceForm.price),
      duration_minutes: parseInt(serviceForm.duration_minutes),
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Serviço adicionado' });
      setServiceForm({ name: '', price: '', duration_minutes: '30' });
      setDialogOpen(false);
      fetchServices();
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    const { error } = await supabase
      .from('services')
      .update({
        name: serviceForm.name,
        price: parseFloat(serviceForm.price),
        duration_minutes: parseInt(serviceForm.duration_minutes),
      })
      .eq('id', editingService.id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Serviço atualizado' });
      setEditingService(null);
      setServiceForm({ name: '', price: '', duration_minutes: '30' });
      setDialogOpen(false);
      fetchServices();
    }
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Serviço removido' });
      fetchServices();
    }
  };

  const upcomingAppointments = appointments.filter((apt) => {
    const appointmentDate = parseISO(apt.appointment_date);
    return !isPast(appointmentDate) || isToday(appointmentDate);
  });

  const pastAppointments = appointments.filter((apt) => {
    const appointmentDate = parseISO(apt.appointment_date);
    return isPast(appointmentDate) && !isToday(appointmentDate);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">BarberPro</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">Admin</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications Bell */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-elevated z-50">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <h3 className="font-semibold text-foreground">Notificações</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary hover:underline"
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground text-sm">
                          Nenhuma notificação
                        </p>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                              !notification.is_read ? 'bg-primary/5' : ''
                            }`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <p className="text-sm text-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(parseISO(notification.created_at), "dd/MM 'às' HH:mm")}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button
            variant={activeTab === 'appointments' ? 'gold' : 'ghost'}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Agendamentos
          </Button>
          <Button
            variant={activeTab === 'barbers' ? 'gold' : 'ghost'}
            onClick={() => setActiveTab('barbers')}
          >
            <Users className="h-4 w-4 mr-2" />
            Barbeiros
          </Button>
          <Button
            variant={activeTab === 'services' ? 'gold' : 'ghost'}
            onClick={() => setActiveTab('services')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Serviços
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-primary">Carregando...</div>
          </div>
        ) : (
          <>
            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="space-y-8 animate-fade-in">
                <section>
                  <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Próximos Agendamentos ({upcomingAppointments.length})
                  </h2>
                  {upcomingAppointments.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-8 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum agendamento futuro</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Serviço</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Barbeiro</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Horário</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {upcomingAppointments.map((apt) => (
                              <tr key={apt.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                <td className="p-4">
                                  <p className="font-medium text-foreground">{apt.client_name}</p>
                                  <p className="text-sm text-muted-foreground">{apt.client_email}</p>
                                </td>
                                <td className="p-4 text-foreground">{apt.services?.name}</td>
                                <td className="p-4 text-foreground">{apt.barbers?.name}</td>
                                <td className="p-4 text-foreground">
                                  {format(parseISO(apt.appointment_date), "dd/MM/yyyy")}
                                </td>
                                <td className="p-4 text-foreground">{apt.appointment_time.slice(0, 5)}</td>
                                <td className="p-4 text-primary font-semibold">
                                  R$ {apt.services?.price?.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>

                {pastAppointments.length > 0 && (
                  <section>
                    <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      Histórico ({pastAppointments.length})
                    </h2>
                    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Serviço</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Barbeiro</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pastAppointments.slice(0, 10).map((apt) => (
                              <tr key={apt.id} className="border-t border-border opacity-75">
                                <td className="p-4">
                                  <p className="font-medium text-foreground">{apt.client_name}</p>
                                </td>
                                <td className="p-4 text-foreground">{apt.services?.name}</td>
                                <td className="p-4 text-foreground">{apt.barbers?.name}</td>
                                <td className="p-4 text-foreground">
                                  {format(parseISO(apt.appointment_date), "dd/MM/yyyy")}
                                </td>
                                <td className="p-4 text-muted-foreground">
                                  R$ {apt.services?.price?.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Barbers Tab */}
            {activeTab === 'barbers' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Barbeiros ({barbers.length})
                  </h2>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="gold"
                        onClick={() => {
                          setEditingBarber(null);
                          setBarberForm({ name: '', photo_url: '', work_start_time: '09:00', work_end_time: '18:00' });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="font-display text-foreground">
                          {editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input
                            value={barberForm.name}
                            onChange={(e) => setBarberForm({ ...barberForm, name: e.target.value })}
                            placeholder="Nome do barbeiro"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>URL da Foto (opcional)</Label>
                          <Input
                            value={barberForm.photo_url}
                            onChange={(e) => setBarberForm({ ...barberForm, photo_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Início do expediente</Label>
                            <Input
                              type="time"
                              value={barberForm.work_start_time}
                              onChange={(e) => setBarberForm({ ...barberForm, work_start_time: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Fim do expediente</Label>
                            <Input
                              type="time"
                              value={barberForm.work_end_time}
                              onChange={(e) => setBarberForm({ ...barberForm, work_end_time: e.target.value })}
                            />
                          </div>
                        </div>
                        <Button
                          variant="gold"
                          className="w-full"
                          onClick={editingBarber ? handleUpdateBarber : handleAddBarber}
                        >
                          {editingBarber ? 'Salvar' : 'Adicionar'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {barbers.map((barber) => (
                    <div
                      key={barber.id}
                      className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {barber.photo_url ? (
                            <img src={barber.photo_url} alt={barber.name} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-foreground truncate">{barber.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {barber.work_start_time.slice(0, 5)} - {barber.work_end_time.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingBarber(barber);
                            setBarberForm({
                              name: barber.name,
                              photo_url: barber.photo_url || '',
                              work_start_time: barber.work_start_time.slice(0, 5),
                              work_end_time: barber.work_end_time.slice(0, 5),
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBarber(barber.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {barbers.length === 0 && (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum barbeiro cadastrado</p>
                  </div>
                )}
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Serviços ({services.length})
                  </h2>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="gold"
                        onClick={() => {
                          setEditingService(null);
                          setServiceForm({ name: '', price: '', duration_minutes: '30' });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="font-display text-foreground">
                          {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Nome do Serviço</Label>
                          <Input
                            value={serviceForm.name}
                            onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                            placeholder="Ex: Corte Masculino"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Preço (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={serviceForm.price}
                              onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                              placeholder="50.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Duração (min)</Label>
                            <Input
                              type="number"
                              value={serviceForm.duration_minutes}
                              onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                              placeholder="30"
                            />
                          </div>
                        </div>
                        <Button
                          variant="gold"
                          className="w-full"
                          onClick={editingService ? handleUpdateService : handleAddService}
                        >
                          {editingService ? 'Salvar' : 'Adicionar'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-display font-semibold text-foreground">{service.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {service.duration_minutes} min
                          </p>
                        </div>
                        <p className="text-xl font-bold text-primary">R$ {service.price.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingService(service);
                            setServiceForm({
                              name: service.name,
                              price: service.price.toString(),
                              duration_minutes: service.duration_minutes.toString(),
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {services.length === 0 && (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum serviço cadastrado</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
