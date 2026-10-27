import { Search, Plus, Bookmark, LogOut, Settings, User } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Avatar, AvatarFallback } from '../ui/Avatar.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu.jsx';
import { cn } from '../lib/cn.js';

export const TopNav = ({ query, onQueryChange, savedCount }) => (
  <header className="sticky top-0 z-30 border-b border-ink-200 bg-surface/85 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:gap-4 sm:px-6">
      <a
        href="#main"
        className="flex shrink-0 items-center gap-2 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2"
        aria-label="Rozgaar home"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-purple-700">
          {/* Simple mark: a stylised doorway, suggesting an opening. */}
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
            <path
              d="M5 20V9.2a1 1 0 0 1 .4-.8l6-4.4a1 1 0 0 1 1.2 0l6 4.4a1 1 0 0 1 .4.8V20"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M10 20v-5.5h4V20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span className="hidden text-[15px] font-semibold tracking-tighter2 text-ink-900 sm:block">
          Rozgaar
        </span>
      </a>

      <div className="relative min-w-0 flex-1 sm:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search roles, companies, skills"
          aria-label="Search jobs"
          className="h-9 pl-9"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          aria-label={`Saved jobs, ${savedCount} saved`}
          className={cn(
            'relative hidden h-9 w-9 items-center justify-center rounded-control text-ink-600 sm:inline-flex',
            'transition-colors duration-150 ease-out hover:bg-ink-100 hover:text-ink-900',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2',
          )}
        >
          <Bookmark className="h-[18px] w-[18px]" aria-hidden="true" />
          {savedCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-deep">
              {savedCount}
            </span>
          ) : null}
        </button>

        <Button variant="primary" size="md" className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Post a job
        </Button>
        <Button variant="primary" size="icon" className="sm:hidden" aria-label="Post a job">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className={cn(
                'rounded-full transition-shadow duration-150 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2',
              )}
            >
              <Avatar>
                <AvatarFallback>AR</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Ananya Rao</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4" aria-hidden="true" />
              My profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bookmark className="h-4 w-4" aria-hidden="true" />
              Saved jobs
              {savedCount > 0 ? (
                <span className="ml-auto text-[11px] text-ink-500">{savedCount}</span>
              ) : null}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4" aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>
);
