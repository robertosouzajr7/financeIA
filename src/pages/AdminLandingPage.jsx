import { useState, useEffect } from "react";
import { LandingPageSettings } from "@/entities/LandingPageSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Upload, Plus, Trash2, Eye, Layout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { UploadFile } from "@/api/integrations";

export default function AdminLandingPage() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { isLoadingAuth, isCurrentOrgAdmin } = useAuth();

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!isCurrentOrgAdmin) {
      alert("Acesso negado: é necessário ser ADMIN da organização atual.");
      navigate(createPageUrl("Dashboard"));
      return;
    }

    loadSettings();
  }, [isLoadingAuth, isCurrentOrgAdmin]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await LandingPageSettings.list();
      if (data.length > 0) {
        setSettings(data[0]);
      } else {
        const defaultSettings = await LandingPageSettings.create({
          hero_title: "Gestão Financeira",
          hero_subtitle: "Inteligente e Simples",
          hero_description: "Controle suas finanças conversando no WhatsApp. IA treinada, segura e poderosa.",
          hero_badge_text: "🚀 IA Financeira no WhatsApp",
          hero_primary_cta: "Começar Agora",
          hero_secondary_cta: "Ver Demonstração",
          stats_users: "500+",
          stats_transactions: "10k+",
          stats_satisfaction: "98%",
          stats_rating: "4.9⭐",
          primary_color: "#10b981",
          testimonials: [
            {
              name: "Maria Silva",
              role: "Empreendedora",
              content: "Revolucionou como gerencio as finanças da minha empresa!",
              avatar: "MS"
            }
          ]
        });
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
    setIsLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setSettings({...settings, hero_image_url: file_url});
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload da imagem");
    }
    setIsUploading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await LandingPageSettings.update(settings.id, settings);
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar configurações");
    }
    setIsSaving(false);
  };

  const addTestimonial = () => {
    const newTestimonials = [...(settings.testimonials || []), {
      name: "",
      role: "",
      content: "",
      avatar: ""
    }];
    setSettings({...settings, testimonials: newTestimonials});
  };

  const removeTestimonial = (index) => {
    const newTestimonials = settings.testimonials.filter((_, i) => i !== index);
    setSettings({...settings, testimonials: newTestimonials});
  };

  const updateTestimonial = (index, field, value) => {
    const newTestimonials = [...settings.testimonials];
    newTestimonials[index][field] = value;
    setSettings({...settings, testimonials: newTestimonials});
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Layout className="w-8 h-8 text-emerald-600" />
              Editor da Landing Page
            </h1>
            <p className="text-slate-600">Personalize cada seção da sua página de vendas</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => window.open(createPageUrl("Landing"), '_blank')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="testimonials">Depoimentos</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
          </TabsList>

          {/* HERO SECTION */}
          <TabsContent value="hero" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Seção Hero (Principal)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Badge do Hero</Label>
                  <Input
                    value={settings?.hero_badge_text || ''}
                    onChange={(e) => setSettings({...settings, hero_badge_text: e.target.value})}
                    placeholder="🚀 IA Financeira no WhatsApp"
                  />
                </div>

                <div>
                  <Label>Título Principal</Label>
                  <Input
                    value={settings?.hero_title || ''}
                    onChange={(e) => setSettings({...settings, hero_title: e.target.value})}
                    placeholder="Gestão Financeira"
                  />
                </div>

                <div>
                  <Label>Subtítulo</Label>
                  <Input
                    value={settings?.hero_subtitle || ''}
                    onChange={(e) => setSettings({...settings, hero_subtitle: e.target.value})}
                    placeholder="Inteligente e Simples"
                  />
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={settings?.hero_description || ''}
                    onChange={(e) => setSettings({...settings, hero_description: e.target.value})}
                    placeholder="Controle suas finanças conversando no WhatsApp..."
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Botão Primário</Label>
                    <Input
                      value={settings?.hero_primary_cta || ''}
                      onChange={(e) => setSettings({...settings, hero_primary_cta: e.target.value})}
                      placeholder="Começar Agora"
                    />
                  </div>
                  <div>
                    <Label>Botão Secundário</Label>
                    <Input
                      value={settings?.hero_secondary_cta || ''}
                      onChange={(e) => setSettings({...settings, hero_secondary_cta: e.target.value})}
                      placeholder="Ver Demonstração"
                    />
                  </div>
                </div>

                <div>
                  <Label>Imagem do Hero</Label>
                  {settings?.hero_image_url && (
                    <div className="mb-4">
                      <img 
                        src={settings.hero_image_url} 
                        alt="Hero" 
                        className="max-w-md rounded-lg border-2 border-slate-200"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="hero-image-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('hero-image-upload').click()}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Enviando...' : 'Fazer Upload'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATS SECTION */}
          <TabsContent value="stats" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Estatísticas e Prova Social</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Empresas Ativas</Label>
                    <Input
                      value={settings?.stats_users || ''}
                      onChange={(e) => setSettings({...settings, stats_users: e.target.value})}
                      placeholder="500+"
                    />
                  </div>
                  <div>
                    <Label>Transações/Dia</Label>
                    <Input
                      value={settings?.stats_transactions || ''}
                      onChange={(e) => setSettings({...settings, stats_transactions: e.target.value})}
                      placeholder="10k+"
                    />
                  </div>
                  <div>
                    <Label>Satisfação</Label>
                    <Input
                      value={settings?.stats_satisfaction || ''}
                      onChange={(e) => setSettings({...settings, stats_satisfaction: e.target.value})}
                      placeholder="98%"
                    />
                  </div>
                  <div>
                    <Label>Avaliação</Label>
                    <Input
                      value={settings?.stats_rating || ''}
                      onChange={(e) => setSettings({...settings, stats_rating: e.target.value})}
                      placeholder="4.9⭐"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TESTIMONIALS SECTION */}
          <TabsContent value="testimonials" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Depoimentos de Clientes</CardTitle>
                <Button onClick={addTestimonial} size="sm" className="bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Depoimento
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings?.testimonials?.map((testimonial, index) => (
                  <Card key={index} className="bg-slate-50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-slate-900">Depoimento {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTestimonial(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label>Nome</Label>
                          <Input
                            value={testimonial.name}
                            onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                            placeholder="Maria Silva"
                          />
                        </div>
                        <div>
                          <Label>Cargo/Role</Label>
                          <Input
                            value={testimonial.role}
                            onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                            placeholder="Empreendedora"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Avatar (Iniciais)</Label>
                        <Input
                          value={testimonial.avatar}
                          onChange={(e) => updateTestimonial(index, 'avatar', e.target.value)}
                          placeholder="MS"
                          maxLength={2}
                        />
                      </div>

                      <div>
                        <Label>Depoimento</Label>
                        <Textarea
                          value={testimonial.content}
                          onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                          placeholder="Escreva o depoimento aqui..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTACT SECTION */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email de Contato</Label>
                  <Input
                    type="email"
                    value={settings?.contact_email || ''}
                    onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                    placeholder="contato@financeia.com"
                  />
                </div>

                <div>
                  <Label>Telefone de Contato</Label>
                  <Input
                    type="tel"
                    value={settings?.contact_phone || ''}
                    onChange={(e) => setSettings({...settings, contact_phone: e.target.value})}
                    placeholder="+55 71 99999-9999"
                  />
                </div>

                <div>
                  <Label>Descrição do Rodapé</Label>
                  <Textarea
                    value={settings?.footer_description || ''}
                    onChange={(e) => setSettings({...settings, footer_description: e.target.value})}
                    placeholder="Gestão financeira inteligente via WhatsApp"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DESIGN SECTION */}
          <TabsContent value="design" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Design e Cores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Cor Primária da Landing Page</Label>
                  <p className="text-xs text-slate-500 mb-2">
                    Esta cor será usada nos botões, badges e destaques da landing page
                  </p>
                  <div className="flex gap-4 items-center">
                    <Input
                      type="color"
                      value={settings?.primary_color || '#10b981'}
                      onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                      className="w-24 h-12 cursor-pointer"
                    />
                    <Input
                      value={settings?.primary_color || '#10b981'}
                      onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                      placeholder="#10b981"
                      className="w-32"
                    />
                    <div 
                      className="w-32 h-12 rounded-lg shadow-md"
                      style={{ backgroundColor: settings?.primary_color }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}