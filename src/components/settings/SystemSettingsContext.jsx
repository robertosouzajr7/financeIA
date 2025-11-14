import { createContext, useState, useContext, useEffect } from 'react';
import { SystemSettings } from '@/entities/SystemSettings';

const SystemSettingsContext = createContext();

export const SystemSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    company_name: 'FinanceIA',
    logo_url: null,
    primary_color: '#10b981',
    support_email: '',
    support_phone: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const data = await SystemSettings.list();
      if (data.length > 0) {
        setSettings(data[0]);
        applyTheme(data[0]);
      }
    } catch (error) {
      console.log("Erro ao carregar configurações do sistema");
    }
    setIsLoading(false);
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const applyTheme = (newSettings) => {
    const color = newSettings.primary_color || '#10b981';
    const rgb = hexToRgb(color);
    
    if (rgb) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      
      // Aplicar variáveis CSS no root
      const root = document.documentElement;
      
      // Cor primária
      root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      
      // Tons derivados
      root.style.setProperty('--primary-50', `${hsl.h} ${hsl.s}% 95%`);
      root.style.setProperty('--primary-100', `${hsl.h} ${hsl.s}% 90%`);
      root.style.setProperty('--primary-200', `${hsl.h} ${hsl.s}% 80%`);
      root.style.setProperty('--primary-300', `${hsl.h} ${hsl.s}% 70%`);
      root.style.setProperty('--primary-400', `${hsl.h} ${hsl.s}% 60%`);
      root.style.setProperty('--primary-500', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      root.style.setProperty('--primary-600', `${hsl.h} ${hsl.s}% ${Math.max(hsl.l - 10, 0)}%`);
      root.style.setProperty('--primary-700', `${hsl.h} ${hsl.s}% ${Math.max(hsl.l - 20, 0)}%`);
      root.style.setProperty('--primary-800', `${hsl.h} ${hsl.s}% ${Math.max(hsl.l - 30, 0)}%`);
      root.style.setProperty('--primary-900', `${hsl.h} ${hsl.s}% ${Math.max(hsl.l - 40, 0)}%`);
      
      // Hex original
      root.style.setProperty('--primary-hex', color);
      
      // Para componentes que usam Tailwind
      root.style.setProperty('--color-primary', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  };

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    applyTheme(newSettings);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const value = { 
    settings, 
    updateSettings,
    refreshSettings: loadSettings,
    isLoading 
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error('useSystemSettings must be used within SystemSettingsProvider');
  }
  return context;
};