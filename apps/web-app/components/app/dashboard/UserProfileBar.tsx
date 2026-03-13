"use client";

import React from "react";
import { User as UserIcon, LogOut } from "lucide-react";
import Image from "next/image";

interface UserProfileBarProps {
  userName: string;
  userAvatar?: string | null;
  onLogout: () => void;
}

const UserProfileBar: React.FC<UserProfileBarProps> = ({
  userName,
  userAvatar,
  onLogout,
}) => {
  const firstName = userName.split(" ")[0];

  return (
    <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-4 mb-2">
      <div className="flex items-center gap-2 text-slate-600">
        {userAvatar ? (
          <Image
            src={userAvatar}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
            <UserIcon size={16} />
          </div>
        )}
        <span className="font-medium text-sm">Olá, {firstName}</span>
      </div>
      <button
        onClick={onLogout}
        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
        title="Sair"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
};

export default UserProfileBar;
