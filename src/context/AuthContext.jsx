import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef(null);
  const userRef = useRef(null);
  const authEventVersionRef = useRef(0);
  const profileRequestVersionRef = useRef(0);
  const profileRequestRef = useRef(null);

  async function loadProfile(sess) {
    if (!sess?.user) {
      profileRequestVersionRef.current += 1;
      profileRequestRef.current = null;
      sessionRef.current = null;
      userRef.current = null;
      setSession(current => current === null ? current : null);
      setUser(null);
      setLoading(false);
      return;
    }

    const userId = sess.user.id;
    sessionRef.current = sess;
    setSession(current => current?.access_token === sess.access_token ? current : sess);

    if (userRef.current?.id === userId) {
      setLoading(false);
      return;
    }

    if (profileRequestRef.current?.userId === userId) {
      return profileRequestRef.current.promise;
    }

    const requestVersion = ++profileRequestVersionRef.current;
    setLoading(true);

    const request = (async () => {
      let profile = null;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) console.error('[auth] load profile failed:', error);
        profile = data;
      } catch (error) {
        console.error('[auth] load profile request rejected:', error);
      } finally {
        const isCurrentRequest = requestVersion === profileRequestVersionRef.current
          && sessionRef.current?.user?.id === userId;

        if (isCurrentRequest) {
          const nextUser = {
            id: userId,
            email: sess.user.email,
            full_name: profile?.full_name || sess.user.email?.split('@')[0] || '',
            avatar_url: profile?.avatar_url || null
          };
          userRef.current = nextUser;
          setUser(current => current?.id === nextUser.id
            && current.email === nextUser.email
            && current.full_name === nextUser.full_name
            && current.avatar_url === nextUser.avatar_url
            ? current
            : nextUser
          );
          setLoading(false);
        }

        if (profileRequestRef.current?.version === requestVersion) {
          profileRequestRef.current = null;
        }
      }
    })();

    profileRequestRef.current = { userId, version: requestVersion, promise: request };
    return request;
  }

  useEffect(() => {
    let active = true;
    const initialEventVersion = authEventVersionRef.current;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!active) return;
      authEventVersionRef.current += 1;
      loadProfile(sess).catch(error => {
        console.error('[auth] session profile handling failed:', error);
        setLoading(false);
      });
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active || authEventVersionRef.current !== initialEventVersion) return;
        if (error) throw error;
        return loadProfile(data?.session ?? null);
      })
      .catch(error => {
        if (!active || authEventVersionRef.current !== initialEventVersion) return;
        console.error('[auth] initial session load failed:', error);
        profileRequestVersionRef.current += 1;
        profileRequestRef.current = null;
        sessionRef.current = null;
        userRef.current = null;
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signUp(email, password, fullName) {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || '' } }
    });

    if (!result.error && result.data?.session) {
      await loadProfile(result.data.session);
    }

    return result;
  }

  async function signIn(email, password) {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (!result.error && result.data?.session) {
      await loadProfile(result.data.session);
    }
    return result;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    profileRequestVersionRef.current += 1;
    profileRequestRef.current = null;
    sessionRef.current = null;
    userRef.current = null;
    setUser(null);
    setSession(null);
    setLoading(false);
  }

  async function updateProfile(updates) {
    if (!user?.id) throw new Error('No authenticated user is available.');

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: updates.full_name })
      .eq('id', user.id)
      .select('id, full_name, avatar_url')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('The profile update was not confirmed.');

    const nextUser = {
      ...user,
      full_name: data.full_name || user.full_name,
      avatar_url: data.avatar_url || null
    };
    userRef.current = nextUser;
    setUser(current => current?.id === user.id ? nextUser : current);

    return data;
  }

  async function resetPassword(email) {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login'
    });
  }

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      signedIn: !!user,
      signUp,
      signIn,
      signOut,
      updateProfile,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
