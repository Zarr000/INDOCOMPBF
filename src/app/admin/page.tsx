'use client';

//admin page

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  LogOut,
  LayoutDashboard,
  Settings,
  ChevronDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import {
  adminLogin,
  adminLogout,
  adminMe,
  createPlayer,
  deletePlayer,
  getPlayers,
  updatePlayer,
  getTalents,
  updateTalentHolder,
  playerImageSrc,
  PlayerPayload,
  Talent,
} from '@/lib/api';

import { Player, Tier } from '@/types/player';
import { discordDisplay, normalizeDiscord, normalizeTikTok, tikTokDisplay } from '@/lib/validate';
import ImagePickerField from '@/components/admin/ImagePickerField';


const TIERS = [
  'HT1',
  'LT1',
  'HT2',
  'LT2',
  'HT3',
  'LT3',
  'HT4',
  'LT4',
  'HT5',
  'LT5',
];

const FRUITS = [
  'Kitsune',
  'Portal',
  'Dough',
  'Control',
  'Sound',
  'Gas',
  'Ghost',
  'Diamond',
  'Flame',
];

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm)(?:[?#].*)?$/i.test(url);
}

type ModalType = 'add' | 'edit' | 'delete' | null;

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [fruitFilter, setFruitFilter] = useState('ALL');

  const [modal, setModal] = useState<ModalType>(null);
  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getPlayers();
      setPlayers(data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load players.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await adminMe();
        if (!session.user) {
          setAuthenticated(false);
          setLoading(false);
          return;
        }
        setAuthenticated(true);
        await loadPlayers();
      } catch {
        setAuthenticated(false);
        setLoading(false);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!loginUsername || !loginPassword) {
      setError('Username and password are required.');
      return;
    }

    try {
      setLoginLoading(true);
      setError(null);
      setSuccessMessage(null);

      await adminLogin(loginUsername, loginPassword);

      setAuthenticated(true);
      setLoginPassword('');

      await loadPlayers();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Login failed.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch (err) {
      console.error(err);
    } finally {
      setAuthenticated(false);
      setPlayers([]);
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesSearch =
        player.name
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesTier =
        tierFilter === 'ALL' ||
        player.tier === tierFilter;

      const matchesFruit =
        fruitFilter === 'ALL' ||
        player.fruit?.toLowerCase() ===
          fruitFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesTier &&
        matchesFruit
      );
    });
  }, [
    players,
    search,
    tierFilter,
    fruitFilter,
  ]);

  const openEdit = (player: Player) => {
    setSelectedPlayer(player);
    setModal('edit');
    setError(null);
    setSuccessMessage(null);
  };

  const openDelete = (player: Player) => {
    setSelectedPlayer(player);
    setModal('delete');
    setError(null);
    setSuccessMessage(null);
  };

  const closeModal = () => {
    setModal(null);
    setSelectedPlayer(null);
  };

  const handleCreate = async (payload: PlayerPayload) => {
    try {
      setError(null);

      await createPlayer(payload);
      await loadPlayers();
      setSuccessMessage('Player created successfully.');

      closeModal();
    } catch (err) {
      console.error(err);

      throw err;
    }
  };

  const handleUpdate = async (
    id: number,
    payload: PlayerPayload
  ) => {
    try {
      setError(null);
      setSuccessMessage(null);

      await updatePlayer(String(id), payload);
      await loadPlayers();
      setSuccessMessage('Player updated successfully.');

      closeModal();
    } catch (err) {
      console.error(err);

      throw err;
    }
  };

  const handleDelete = async (player: Player) => {
    try {
      setError(null);
      setSuccessMessage(null);

      await deletePlayer(player.id);
      await loadPlayers();
      setSuccessMessage('Player deleted successfully.');

      closeModal();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete player.'
      );

      throw err;
    }
  };

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="flex items-center gap-3 font-rajdhani text-sm uppercase tracking-[0.2em] text-white/40">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Checking authentication
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <LoginScreen
        username={loginUsername}
        password={loginPassword}
        loading={loginLoading}
        error={error}
        onUsernameChange={setLoginUsername}
        onPasswordChange={setLoginPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="mb-1 font-rajdhani text-xs uppercase tracking-[0.3em] text-white/35">
              INDOCOMPBF
            </p>

            <h1 className="font-bebas text-5xl tracking-wide sm:text-6xl">
              Admin Panel
            </h1>

            <p className="mt-1 font-outfit text-sm text-white/40">
              Manage competitive rankings and player data.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="glass flex w-fit items-center gap-2 rounded-full px-5 py-3 font-rajdhani text-sm uppercase tracking-wider transition hover:bg-white/10"
          >
            <LogOut size={16} />
            Logout
          </button>
        </motion.header>

        {/* NAV */}
        <nav className="mb-8 flex gap-2 overflow-x-auto pb-1">
          <NavButton
            active
            icon={<LayoutDashboard size={16} />}
          >
            Dashboard
          </NavButton>

          <NavButton icon={<Users size={16} />}>
            Players
          </NavButton>

          <NavButton icon={<Settings size={16} />}>
            Settings
          </NavButton>
        </nav>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
            <span aria-hidden="true">&#10003;</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* STATS */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Players"
            value={players.length.toString()}
            description="Registered players"
            icon={<Users size={19} />}
          />

          <StatCard
            label="Highest Tier"
            value="HT1"
            description="Top competitive tier"
          />

          <StatCard
            label="Filtered"
            value={filteredPlayers.length.toString()}
            description="Players matching filters"
          />
        </section>

        {/* PLAYER MANAGEMENT */}
        <section className="glass rounded-2xl border border-white/[0.06] p-4 sm:p-6">

          {/* SECTION HEADER */}
          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bebas text-3xl tracking-wide">
                Player Management
              </h2>

              <p className="font-outfit text-sm text-white/35">
                Search, filter and manage ranked players.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccessMessage(null);
                setModal('add');
              }}
              className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-rajdhani text-sm font-semibold uppercase tracking-wider text-black transition hover:bg-white/90"
            >
              <Plus size={17} />
              Add Player
            </button>
          </div>

          {/* FILTERS */}
          <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto_auto]">

            <div className="relative">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search player..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] py-3 pl-11 pr-4 font-outfit text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.04]"
              />
            </div>

            <FilterSelect
              value={tierFilter}
              onChange={setTierFilter}
              options={['ALL', ...TIERS]}
            />

            <FilterSelect
              value={fruitFilter}
              onChange={setFruitFilter}
              options={['ALL', ...FRUITS]}
            />
          </div>

          {/* RESULTS */}
          <div className="mb-4 flex items-center justify-between">
            <p className="font-rajdhani text-xs uppercase tracking-[0.18em] text-white/30">
              {loading
                ? 'Loading...'
                : `${filteredPlayers.length} Players`}
            </p>

            {(search ||
              tierFilter !== 'ALL' ||
              fruitFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTierFilter('ALL');
                  setFruitFilter('ALL');
                }}
                className="font-rajdhani text-xs uppercase tracking-wider text-white/40 transition hover:text-white"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* LOADING */}
          {loading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 font-rajdhani text-sm uppercase tracking-[0.2em] text-white/30">
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Loading players
              </div>
            </div>
          )}

          {/* DESKTOP TABLE */}
          {!loading && (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-white/[0.06] md:block">
                <div className="grid grid-cols-[70px_1.5fr_100px_130px_1fr_150px] border-b border-white/[0.06] bg-white/[0.025] px-5 py-3">
                  <TableHeader>Rank</TableHeader>
                  <TableHeader>Player</TableHeader>
                  <TableHeader>Tier</TableHeader>
                  <TableHeader>Fruit</TableHeader>
                  <TableHeader>Country</TableHeader>
                  <TableHeader align="right">
                    Actions
                  </TableHeader>
                </div>

                <div>
                  <AnimatePresence initial={false}>
                    {filteredPlayers.map((player) => (
                      <PlayerRow
                        key={player.id}
                        rank={players.findIndex((item) => item.id === player.id) + 1}
                        player={player}
                        onEdit={() =>
                          openEdit(player)
                        }
                        onDelete={() =>
                          openDelete(player)
                        }
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* MOBILE */}
              <div className="space-y-3 md:hidden">
                <AnimatePresence initial={false}>
                    {filteredPlayers.map((player) => (
                    <MobilePlayerCard
                      key={player.id}
                      rank={players.findIndex((item) => item.id === player.id) + 1}
                      player={player}
                      onEdit={() =>
                        openEdit(player)
                      }
                      onDelete={() =>
                        openDelete(player)
                      }
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* EMPTY */}
              {filteredPlayers.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/[0.08] py-16 text-center">
                  <Search
                    size={28}
                    className="mx-auto mb-3 text-white/15"
                  />

                  <p className="font-rajdhani text-sm uppercase tracking-wider text-white/35">
                    No players found
                  </p>

                  <p className="mt-1 font-outfit text-xs text-white/20">
                    Try changing your search or filters.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {modal === 'add' && (
          <PlayerModal
            title="Add Player"
            description="Create a new ranked player."
            onClose={closeModal}
            onSubmit={handleCreate}
          />
        )}

        {modal === 'edit' && selectedPlayer && (
          <PlayerModal
            title="Edit Player"
            description={`Editing ${selectedPlayer.name}`}
            player={selectedPlayer}
            onClose={closeModal}
            onSubmit={(payload) =>
              handleUpdate(
                Number(selectedPlayer.id),
                payload
              )
            }
          />
        )}

        {modal === 'delete' && selectedPlayer && (
          <DeleteModal
            player={selectedPlayer}
            onClose={closeModal}
            onConfirm={() =>
              handleDelete(selectedPlayer)
            }
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ---------------- LOGIN ---------------- */

function LoginScreen({
  username,
  password,
  loading,
  error,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: {
  username: string;
  password: string;
  loading: boolean;
  error: string | null;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      {/* Background blobs for premium feel */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-white/[0.03] rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-[120px]" />
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        onSubmit={onSubmit}
        className="glass w-full max-w-md rounded-2xl border border-white/[0.08] p-8 sm:p-10 relative z-10 shadow-2xl"
      >
        <div className="mb-10 text-center">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-2 font-rajdhani text-xs uppercase tracking-[0.4em] text-white/30"
          >
            INDOCOMPBF
          </motion.p>

          <h1 className="font-bebas text-6xl tracking-tight text-white/90">
            ADMIN LOGIN
          </h1>

          <div className="h-1 w-12 bg-white/10 mx-auto mt-4 rounded-full" />
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            <AlertCircle size={18} />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}

        <div className="space-y-5">
          <FormField label="Email Address">
            <input
              type="email"
              value={username}
              onChange={(event) => onUsernameChange(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="admin-input w-full py-3.5 px-5 bg-white/[0.03] border-white/[0.08] focus:border-white/20 transition-all text-base"
            />
          </FormField>

          <FormField label="Password">
            <input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="admin-input w-full py-3.5 px-5 bg-white/[0.03] border-white/[0.08] focus:border-white/20 transition-all text-base"
            />
          </FormField>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-10 flex w-full items-center justify-center gap-3 rounded-xl bg-white py-4 font-rajdhani text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:bg-[#efefef] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </motion.form>
    </main>
  );
}

/* ---------------- COMPONENTS ---------------- */

function NavButton({
  children,
  icon,
  active = false,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 font-rajdhani text-xs uppercase tracking-wider transition ${
        active
          ? 'bg-white text-black'
          : 'glass text-white/50 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="glass premium-card rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-rajdhani text-xs uppercase tracking-[0.18em] text-white/35">
          {label}
        </span>

        {icon && (
          <span className="text-white/25">
            {icon}
          </span>
        )}
      </div>

      <div className="font-bebas text-5xl tracking-wide">
        {value}
      </div>

      <p className="mt-1 font-outfit text-xs text-white/30">
        {description}
      </p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.025] py-3 pl-4 pr-10 font-rajdhani text-sm uppercase tracking-wider text-white outline-none transition focus:border-white/20"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-black text-white"
          >
            {option === 'ALL'
              ? 'All'
              : option}
          </option>
        ))}
      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
      />
    </div>
  );
}

function TableHeader({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <div
      className={`font-rajdhani text-[10px] uppercase tracking-[0.18em] text-white/25 ${
        align === 'right'
          ? 'text-right'
          : ''
      }`}
    >
      {children}
    </div>
  );
}

function PlayerRow({
  player,
  rank,
  onEdit,
  onDelete,
}: {
  player: Player;
  rank: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-[70px_1.5fr_100px_130px_1fr_150px] items-center border-b border-white/[0.045] px-5 py-3.5 transition last:border-b-0 hover:bg-white/[0.025]"
    >
      <span className="font-mono text-xs text-white/25">
        #{rank}
      </span>

      <div className="flex min-w-0 items-center gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
          {player.image && (
            isVideoUrl(player.image) ? (
              <video
                src={playerImageSrc(player.image)}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={playerImageSrc(player.image)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )
          )}
        </div>

        <span className="truncate font-rajdhani text-sm font-semibold">
          {player.name}
        </span>
      </div>

      <span className="font-rajdhani text-sm font-semibold">
        {player.tier}
      </span>

      <span className="font-outfit text-xs text-white/50">
        {player.fruit || '—'}
      </span>

      <span className="font-outfit text-xs text-white/35">
        {player.country}
      </span>

      <div className="flex justify-end gap-2">
        <ActionButton
          icon={<Pencil size={14} />}
          label="Edit"
          onClick={onEdit}
        />

        <ActionButton
          danger
          icon={<Trash2 size={14} />}
          label="Delete"
          onClick={onDelete}
        />
      </div>
    </motion.div>
  );
}

function MobilePlayerCard({
  player,
  rank,
  onEdit,
  onDelete,
}: {
  player: Player;
  rank: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10">
          {player.image && (
            isVideoUrl(player.image) ? (
              <video
                muted
                playsInline
                preload="metadata"
                src={playerImageSrc(player.image)}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={playerImageSrc(player.image)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-rajdhani font-semibold">
            {player.name}
          </p>

          <p className="font-outfit text-xs text-white/30">
            #{rank} · {player.country}
          </p>
        </div>

        <span className="font-rajdhani text-sm font-semibold">
          {player.tier}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
        <span className="font-outfit text-xs text-white/40">
          {player.fruit || 'No fruit'}
        </span>

        <div className="flex gap-2">
          <ActionButton
            icon={<Pencil size={14} />}
            label="Edit"
            onClick={onEdit}
          />

          <ActionButton
            danger
            icon={<Trash2 size={14} />}
            label="Delete"
            onClick={onDelete}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 font-rajdhani text-[11px] uppercase tracking-wider transition ${
        danger
          ? 'border-white/[0.06] text-white/35 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400'
          : 'border-white/[0.06] text-white/35 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      {icon}
      <span className="hidden xl:inline">
        {label}
      </span>
    </button>
  );
}

function ModalBackdrop({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md"
      style={{ minHeight: '100dvh', alignItems: 'safe center' }}
    >
      <div className="flex min-h-0 max-h-[100dvh] w-full max-w-2xl flex-col py-4">
        {children}
      </div>
    </motion.div>
  );
}

function PlayerModal({
  title,
  description,
  player,
  onClose,
  onSubmit,
}: {
  title: string;
  description: string;
  player?: Player;
  onClose: () => void;
  onSubmit: (
    payload: PlayerPayload
  ) => Promise<void>;
}) {
  const [name, setName] = useState(
    player?.name || ''
  );

  const [tier, setTier] = useState<Tier>(
    player?.tier || 'LT5'
  );

  const [country, setCountry] = useState(
    player?.country || 'Indonesia'
  );

  const [fruit, setFruit] = useState(
    player?.fruit || ''
  );

  const [image, setImage] = useState(
    player?.image || ''
  );

  const [discord, setDiscord] = useState(
    discordDisplay(player?.discord)
  );

  const [youtube, setYoutube] = useState(
    player?.youtube || ''
  );

  const [tiktok, setTiktok] = useState(
    tikTokDisplay(player?.tiktok)
  );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // --- Talent assignment (fruit / sword) ---
  // A player can hold multiple talents at once, including more
  // than one within the same category (e.g. Portal + Sand, both fruit).

  const [talents, setTalents] =
    useState<Talent[]>([]);

  const [talentsLoading, setTalentsLoading] =
    useState(true);

  const [fruitTalentIds, setFruitTalentIds] =
    useState<string[]>([]);

  const [swordTalentIds, setSwordTalentIds] =
    useState<string[]>([]);

  const [initialFruitTalentIds, setInitialFruitTalentIds] =
    useState<string[]>([]);

  const [initialSwordTalentIds, setInitialSwordTalentIds] =
    useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTalents()
      .then((data) => {
        if (cancelled) return;

        setTalents(data);

        const currentName = (player?.name || '')
          .trim()
          .toLowerCase();

        if (currentName) {
          const heldFruitIds = data
            .filter(
              (t) =>
                t.category === 'fruit' &&
                t.holder.trim().toLowerCase() === currentName
            )
            .map((t) => String(t.id));

          const heldSwordIds = data
            .filter(
              (t) =>
                t.category === 'sword' &&
                t.holder.trim().toLowerCase() === currentName
            )
            .map((t) => String(t.id));

          setFruitTalentIds(heldFruitIds);
          setInitialFruitTalentIds(heldFruitIds);

          setSwordTalentIds(heldSwordIds);
          setInitialSwordTalentIds(heldSwordIds);
        }
      })
      .catch((err) => {
        console.error('Failed to load talents:', err);
      })
      .finally(() => {
        if (!cancelled) setTalentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fruitTalentOptions = talents.filter(
    (t) => t.category === 'fruit'
  );

  const swordTalentOptions = talents.filter(
    (t) => t.category === 'sword'
  );

  const toggleTalent = (
    id: string,
    category: 'fruit' | 'sword'
  ) => {
    const setter =
      category === 'fruit'
        ? setFruitTalentIds
        : setSwordTalentIds;

    setter((prev) =>
      prev.includes(id)
        ? prev.filter((existing) => existing !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Player name is required.');
      return;
    }

    if (!country.trim()) {
      setError('Country is required.');
      return;
    }

    const finalName = name.trim();
    const normalizedDiscord = normalizeDiscord(discord);
    const normalizedTikTok = normalizeTikTok(tiktok);
    if (normalizedDiscord === undefined) {
      setError('Enter a valid Discord User ID or Discord user URL.');
      return;
    }
    if (normalizedTikTok === undefined) {
      setError('Enter a valid TikTok username or TikTok profile URL.');
      return;
    }

    const payload: PlayerPayload = {
      name: finalName,
      tier,
      country: country.trim(),
      image: image.trim(),
      fruit,
      discord: normalizedDiscord ?? '',
      youtube: youtube.trim(),
      tiktok: normalizedTikTok ?? '',
    };

    try {
      setSaving(true);
      setError(null);

      await onSubmit(payload);

      // Release talents that were deselected, assign the ones newly picked.
      const fruitToRelease = initialFruitTalentIds.filter(
        (id) => !fruitTalentIds.includes(id)
      );
      const fruitToAssign = fruitTalentIds.filter(
        (id) => !initialFruitTalentIds.includes(id)
      );

      const swordToRelease = initialSwordTalentIds.filter(
        (id) => !swordTalentIds.includes(id)
      );
      const swordToAssign = swordTalentIds.filter(
        (id) => !initialSwordTalentIds.includes(id)
      );

      for (const id of [...fruitToRelease, ...swordToRelease]) {
        await updateTalentHolder(Number(id), 'Example');
      }

      for (const id of [...fruitToAssign, ...swordToAssign]) {
        await updateTalentHolder(Number(id), finalName);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save player.'
      );
    } finally {
      setSaving(false);
    }
  };

  const renderTalentChecklist = (
    options: Talent[],
    selectedIds: string[],
    category: 'fruit' | 'sword',
    initialIds: string[]
  ) => (
    <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.02] p-2">
      {talentsLoading && (
        <p className="px-2 py-1 font-outfit text-xs text-white/35">
          Loading...
        </p>
      )}

      {!talentsLoading && options.length === 0 && (
        <p className="px-2 py-1 font-outfit text-xs text-white/35">
          No talents found.
        </p>
      )}

      {options.map((t) => {
        const idStr = String(t.id);
        const checked = selectedIds.includes(idStr);

        const heldByOther =
          t.holder &&
          t.holder.trim().toLowerCase() !== 'example' &&
          !initialIds.includes(idStr);

        return (
          <label
            key={t.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-white/[0.05]"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleTalent(idStr, category)}
              className="accent-white"
            />

            <span className="font-outfit text-white/80">
              {t.name}
            </span>

            {heldByOther && (
              <span className="ml-auto font-outfit text-[11px] text-white/30">
                held by {t.holder}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );

  return (
    <ModalBackdrop>
      <motion.form
        initial={{
          opacity: 0,
          scale: 0.96,
          y: 10,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: 10,
        }}
        onSubmit={handleSubmit}
        className="glass my-auto flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] p-6 shadow-2xl sm:my-8"
      >
        <div className="mb-6 flex flex-shrink-0 items-start justify-between">
          <div>
            <h3 className="font-bebas text-3xl">
              {title}
            </h3>

            <p className="mt-1 font-outfit text-xs text-white/40">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close player form"
            className="rounded-full p-2 text-white/30 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-5 flex flex-shrink-0 items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Player Name">
            <input
              required
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Player Name"
              className="admin-input"
            />
          </FormField>

          <FormField label="Tier">
            <select
              value={tier}
              onChange={(event) =>
                setTier(event.target.value as Tier)
              }
              className="admin-input"
            >
              {TIERS.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Country">
            <input
              required
              value={country}
              onChange={(event) =>
                setCountry(event.target.value)
              }
              placeholder="Country"
              className="admin-input"
            />
          </FormField>

          <FormField label="Fruit">
            <select
              value={fruit}
              onChange={(event) =>
                setFruit(event.target.value)
              }
              className="admin-input"
            >
              <option value="">
                No Fruit
              </option>

              {FRUITS.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Fruit Talents">
            {renderTalentChecklist(
              fruitTalentOptions,
              fruitTalentIds,
              'fruit',
              initialFruitTalentIds
            )}
          </FormField>

          <FormField label="Sword Talents">
            {renderTalentChecklist(
              swordTalentOptions,
              swordTalentIds,
              'sword',
              initialSwordTalentIds
            )}
          </FormField>

          <FormField label="Image">
            <ImagePickerField
              value={image}
              onChange={setImage}
              playerName={name}
            />
          </FormField>

          <FormField label="Discord User ID">
            <input
              type="text"
              value={discord}
              onChange={(event) =>
                setDiscord(event.target.value)
              }
              placeholder="123456789012345678"
              className="admin-input"
            />
          </FormField>

          <FormField label="YouTube">
            <input
              type="url"
              value={youtube}
              onChange={(event) =>
                setYoutube(event.target.value)
              }
              placeholder="YouTube URL"
              className="admin-input"
            />
          </FormField>

          <FormField label="TikTok Username">
            <input
              type="text"
              value={tiktok}
              onChange={(event) =>
                setTiktok(event.target.value)
              }
              placeholder="username"
              className="admin-input"
            />
          </FormField>
          </div>
        </div>

        <div className="mt-7 flex flex-shrink-0 justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="glass rounded-full px-5 py-3 font-rajdhani text-sm uppercase tracking-wider text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-rajdhani text-sm font-semibold uppercase tracking-wider text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && (
              <Loader2
                size={15}
                className="animate-spin"
              />
            )}

            {saving
              ? 'Saving...'
              : player
                ? 'Save Changes'
                : 'Create Player'}
          </button>
        </div>
      </motion.form>
    </ModalBackdrop>
  );
}

function DeleteModal({
  player,
  onClose,
  onConfirm,
}: {
  player: Player;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);

      await onConfirm();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete player.'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalBackdrop>
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
        }}
        className="glass w-full max-w-md rounded-2xl border border-white/[0.08] p-6"
      >
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
          <Trash2 size={19} />
        </div>

        <h3 className="font-bebas text-3xl">
          Delete Player?
        </h3>

        <p className="mt-2 font-outfit text-sm leading-relaxed text-white/40">
          You are about to delete{' '}
          <span className="font-semibold text-white">
            {player.name}
          </span>
          . This action will permanently remove
          the player from the database.
        </p>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            aria-label="Cancel delete"
            className="glass rounded-full px-5 py-3 font-rajdhani text-sm uppercase tracking-wider text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-full bg-red-500/10 px-5 py-3 font-rajdhani text-sm font-semibold uppercase tracking-wider text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting && (
              <Loader2
                size={15}
                className="animate-spin"
              />
            )}

            {deleting
              ? 'Deleting...'
              : 'Delete'}
          </button>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <span className="mb-2 block font-rajdhani text-[11px] uppercase tracking-[0.18em] text-white/30">
        {label}
      </span>

      {children}
    </div>
  );
}
