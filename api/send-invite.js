export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, studentName, inviteLink, lang = 'en', type } = req.body;
  if (!email || !studentName || !inviteLink) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Resend API key is not configured' });
  }

  // Localized templates dictionary based on request type
  const templates = type === 'reset-password' ? {
    en: {
      subject: 'Reset your Bridge account password',
      title: 'Bridge',
      subtitle: 'Global Cultural Exchange',
      greeting: `Hello ${studentName},`,
      body1: 'We received a request to reset your password for your <strong>Bridge</strong> account.',
      body2: 'Click the button below to choose a new password. If you did not make this request, you can safely ignore this email.',
      button: 'Reset Password',
      footer: `If the button above does not work, copy and paste this link into your browser:<br><a href="${inviteLink}" style="color: #3b82f6;">${inviteLink}</a>`,
      fromName: 'Bridge Security'
    },
    de: {
      subject: 'Setze dein Bridge-Passwort zurück',
      title: 'Bridge',
      subtitle: 'Globaler Kulturaustausch',
      greeting: `Hallo ${studentName},`,
      body1: 'Wir haben eine Anfrage erhalten, das Passwort für dein <strong>Bridge</strong>-Konto zurückzusetzen.',
      body2: 'Klicke auf die Schaltfläche unten, um ein neues Passwort zu wählen. Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren.',
      button: 'Passwort zurücksetzen',
      footer: `Wenn die Schaltfläche oben nicht funktioniert, kopiere diesen Link in deinen Browser:<br><a href="${inviteLink}" style="color: #3b82f6;">${inviteLink}</a>`,
      fromName: 'Bridge Sicherheit'
    },
    fr: {
      subject: 'Réinitialisez le mot de passe de votre compte Bridge',
      title: 'Bridge',
      subtitle: 'Échange Culturel Mondial',
      greeting: `Bonjour ${studentName},`,
      body1: 'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte <strong>Bridge</strong>.',
      body2: 'Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Si vous n\'avez pas fait cette demande, vous pouvez ignorer cet e-mail en toute sécurité.',
      button: 'Réinitialiser le mot de passe',
      footer: `Si le bouton ci-dessus ne fonctionne pas, copie et colle ce lien dans ton navigateur :<br><a href="${inviteLink}" style="color: #3b82f6;">${inviteLink}</a>`,
      fromName: 'Sécurité Bridge'
    },
    es: {
      subject: 'Restablecer la contraseña de su cuenta de Bridge',
      title: 'Bridge',
      subtitle: 'Intercambio Cultural Global',
      greeting: `Hola ${studentName},`,
      body1: 'Hemos recibido una solicitud para restablecer la contraseña de su cuenta de <strong>Bridge</strong>.',
      body2: 'Haga clic en el botón de abajo para elegir una nueva contraseña. Si no realizó esta solicitud, puede ignorar este correo electrónico de forma segura.',
      button: 'Restablecer contraseña',
      footer: `Si el botón de arriba no funciona, copia y pega este enlace en tu navegador:<br><a href="${inviteLink}" style="color: #3b82f6;">${inviteLink}</a>`,
      fromName: 'Seguridad Bridge'
    }
  } : {
    en: {
      subject: 'Bridge Invite: Collaborate with international classrooms!',
      title: 'Bridge',
      subtitle: 'Global Cultural Exchange',
      greeting: `Hello ${studentName},`,
      body1: 'Your teacher has invited you to join <strong>Bridge</strong>, our international classroom exchange platform!',
      body2: 'Use Bridge to collaborate with classrooms worldwide, build shared project slide decks, chat with partners, and translate messages automatically.',
      button: 'Join Your Classroom',
      footer: `If the button above does not work, copy and paste this link into your browser:<br><a href="${inviteLink}" style="color: #3b82f6;">${inviteLink}</a>`,
      fromName: 'Bridge Invitation'
    },
    de: {
      subject: 'Bridge Einladung: Arbeite mit internationalen Klassen zusammen!',
      title: 'Bridge',
      subtitle: 'Globaler Kulturaustausch',
      greeting: `Hallo ${studentName},`,
      body1: 'Dein Lehrer hat dich eingeladen, <strong>Bridge</strong> beizutreten, unserer Plattform für den internationalen Klassenaustausch!',
      body2: 'Nutze Bridge, um mit Klassen weltweit zusammenzuarbeiten, gemeinsame Projekt-Präsentationen zu erstellen, mit Partnern zu chatten und Nachrichten automatisch zu übersetzen.',
      button: 'Deiner Klasse beitreten',
      footer: `Wenn die Schaltfläche oben nicht funktioniert, kopiere diesen Link in deinen Browser:<br><a href="${inviteLink}" style="color: #3b82f6;">${inviteLink}</a>`,
      fromName: 'Bridge Einladung'
    },
    fr: {
      subject: 'Invitation Bridge : Collabore avec des classes internationales !',
      title: 'Bridge',
      subtitle: 'Échange Culturel Mondial',
      greeting: `Bonjour ${studentName},`,
      body1: "Ton enseignant t'a invité à rejoindre <strong>Bridge</strong>, notre plateforme d'échange scolaire international !",
      body2: 'Utilise Bridge pour collaborer avec des classes du monde entier, créer des diaporamas de projet partagés, discuter avec tes partenaires et traduire automatiquement les messages.',
      button: 'Rejoindre ta classe',
      footer: `Si le bouton ci-dessus ne fonctionne pas, copie et colle ce lien dans ton navigateur :<br><a href="${inviteLink}" style="color: #3b82f6;">${inviteLink}</a>`,
      fromName: 'Invitation Bridge'
    },
    es: {
      subject: 'Invitación de Bridge: ¡Colabora con clases internacionales!',
      title: 'Bridge',
      subtitle: 'Intercambio Cultural Global',
      greeting: `Hola ${studentName},`,
      body1: '¡Tu profesor te ha invitado a unirte a <strong>Bridge</strong>, nuestra plataforma de intercambio escolar internacional!',
      body2: 'Utiliza Bridge para colaborar con clases de todo el mundo, crear presentaciones de proyectos compartidos, chatear con compañeros y traducir mensajes automáticamente.',
      button: 'Unirse a tu clase',
      footer: `Si el botón de arriba no funciona, copia y pega este enlace en tu navegador:<br><a href="${inviteLink}" style="color: #3b82f6;">${inviteLink}</a>`,
      fromName: 'Invitación de Bridge'
    }
  };

  const t = templates[lang.toLowerCase()] || templates.en;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: `${t.fromName} <noreply@school-bridge.org>`,
        to: [email],
        subject: t.subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">${t.title}</h1>
              <p style="color: #4a5568; margin: 4px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">${t.subtitle}</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6; font-weight: bold;">${t.greeting}</p>
            <p style="font-size: 16px; line-height: 1.6;">${t.body1}</p>
            <p style="font-size: 16px; line-height: 1.6;">${t.body2}</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${inviteLink}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">${t.button}</a>
            </div>
            <p style="font-size: 14px; color: #718096; line-height: 1.5; margin-bottom: 0;">${t.footer}</p>
          </div>
        `
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Resend API error' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
