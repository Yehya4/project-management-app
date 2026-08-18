export const getRoleAcronym = (role) => {
  if (!role) return '';
  const r = role.toString().trim();
  if (r.toLowerCase() === 'project manager' || r.toLowerCase() === 'chef de projet' || r === 'PM') return 'PM';
  if (r.toLowerCase() === 'developer' || r.toLowerCase() === 'développeur' || r === 'Dev') return 'Dev';
  if (r.toLowerCase() === 'tester' || r.toLowerCase() === 'testeur' || r === 'Tester') return 'Tester';
  if (r.toLowerCase() === 'sponsor' || r === 'Sponsor') return 'Sponsor';
  if (r.toLowerCase() === 'admin' || r.toLowerCase() === 'administrateur' || r === 'Admin') return 'Admin';
  if (r.toLowerCase() === 'responsable infra' || r === 'Responsable Infra') return 'Infra';
  if (r.toLowerCase() === 'user' || r.toLowerCase() === 'demandeur' || r === 'User') return 'User';
  return r;
};

export const formatUserDisplayName = (userOrName, role, usersList = []) => {
  if (!userOrName) {
    if (usersList && usersList.length > 0 && (role === 'PM' || role === 'Project Manager')) {
      const pm = usersList.find(u => u.role === 'Project Manager');
      if (pm) return `${pm.prenom || ''} ${pm.nom || ''}`.trim() + ' (PM)';
    }
    return '-';
  }

  
  if (typeof userOrName === 'object' && userOrName !== null) {
    const prenom = userOrName.prenom || '';
    const nom = userOrName.nom || '';
    const userRole = userOrName.role || role || '';
    const fullName = `${prenom} ${nom}`.trim() || userOrName.name || userOrName.email || 'Utilisateur';
    const acr = getRoleAcronym(userRole);
    if (!acr) return fullName;
    return fullName.includes(`(${acr})`) ? fullName : `${fullName} (${acr})`;
  }

  const rawStr = userOrName.toString().trim();
  if (!rawStr || rawStr === '-') return '-';

  
  const isPMRole = role === 'PM' || role === 'Project Manager' ||
                   rawStr.toLowerCase().includes('project manager') ||
                   rawStr.toLowerCase().includes('chef de projet') ||
                   /\(PM\)$/i.test(rawStr);

  const isSponsorRole = role === 'Sponsor' || rawStr.toLowerCase().includes('sponsor') || /\(Sponsor\)$/i.test(rawStr);

  
  if (usersList && usersList.length > 0) {
    
    const cleanRaw = rawStr.replace(/\s*\([A-Za-z0-9\s]+\)$/, '').trim().toLowerCase();
    const matchedUser = usersList.find(u => {
      const full1 = `${u.prenom || ''} ${u.nom || ''}`.trim().toLowerCase();
      const full2 = `${u.nom || ''} ${u.prenom || ''}`.trim().toLowerCase();
      return (full1 && full1 === cleanRaw) || (full2 && full2 === cleanRaw);
    });

    if (matchedUser) {
      const full = `${matchedUser.prenom || ''} ${matchedUser.nom || ''}`.trim();
      const acr = getRoleAcronym(matchedUser.role || role);
      return full ? (full.includes(`(${acr})`) ? full : `${full} (${acr})`) : rawStr;
    }

    // Second: If it's a PM field/string, map directly to the active PM user from Administration
    if (isPMRole) {
      const pmUser = usersList.find(u => u.role === 'Project Manager');
      if (pmUser) {
        const full = `${pmUser.prenom || ''} ${pmUser.nom || ''}`.trim();
        return full ? `${full} (PM)` : 'Project Manager (PM)';
      }
    }

    
    if (isSponsorRole) {
      const sponsorUser = usersList.find(u => u.role === 'Sponsor');
      if (sponsorUser) {
        const full = `${sponsorUser.prenom || ''} ${sponsorUser.nom || ''}`.trim();
        return full ? `${full} (Sponsor)` : 'Sponsor (Sponsor)';
      }
    }
  }

  
  if (/\([A-Za-z0-9\s]+\)$/.test(rawStr)) {
    return rawStr;
  }

  const acr = getRoleAcronym(role);
  return acr ? `${rawStr} (${acr})` : rawStr;
};
