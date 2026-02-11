
import React from 'react';
import { CreatorInfo } from '../types';

interface CreatorCardProps {
  info: CreatorInfo;
}

const CreatorCard: React.FC<CreatorCardProps> = ({ info }) => {
  return (
    <div className="mt-4 p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center text-center">
        <img 
          src={info.image} 
          alt={info.name} 
          className="w-24 h-24 rounded-full border-4 border-blue-500 mb-4 object-cover"
        />
        <h3 className="text-xl font-bold text-white mb-1">{info.name}</h3>
        <p className="text-sm text-gray-400 mb-4">Master's Creator</p>
        
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <a 
            href={info.facebook} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
          >
            Facebook
          </a>
          <a 
            href={`https://wa.me/${info.whatsapp.replace('+', '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
          >
            WhatsApp
          </a>
          <a 
            href={info.youtube} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
          >
            YouTube
          </a>
          <a 
            href={`mailto:${info.email}`}
            className="flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
          >
            Email
          </a>
        </div>
      </div>
    </div>
  );
};

export default CreatorCard;
