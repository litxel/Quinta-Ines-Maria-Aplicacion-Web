import React from 'react';
import * as icons from 'lucide-react';

export default function LucideIcon({ name, size = 24, className = '', color = 'currentColor' }) {
  // Check if name is a valid string, otherwise fallback to HelpCircle or Sparkles
  if (!name || typeof name !== 'string') {
    return <icons.HelpCircle size={size} className={className} color={color} />;
  }
  
  const Icon = icons[name];
  
  if (!Icon) {
    // If the icon name isn't found in the library, show a default icon
    return <icons.Sparkles size={size} className={className} color={color} />;
  }
  
  return <Icon size={size} className={className} color={color} />;
}
