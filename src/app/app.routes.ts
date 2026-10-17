import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/splash/splash.page').then((m) => m.SplashPage) },
  { path: 'onboarding', canActivate: [guestGuard], loadComponent: () => import('./pages/onboarding/onboarding.page').then((m) => m.OnboardingPage) },
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage) },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: 'home', loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage) },
      { path: 'challenges', loadComponent: () => import('./pages/challenges/challenges.page').then((m) => m.ChallengesPage) },
      { path: 'focus', loadComponent: () => import('./pages/focus/focus.page').then((m) => m.FocusPage) },
      { path: 'chat', loadComponent: () => import('./pages/chat/chat.page').then((m) => m.ChatPage) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage) },
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },
  { path: 'mood', canActivate: [authGuard], loadComponent: () => import('./pages/mood/mood.page').then((m) => m.MoodPage) },
  { path: 'support', canActivate: [authGuard], loadComponent: () => import('./pages/support/support.page').then((m) => m.SupportPage) },
  { path: 'progress', canActivate: [authGuard], loadComponent: () => import('./pages/progress/progress.page').then((m) => m.ProgressPage) },
  { path: 'achievements', canActivate: [authGuard], loadComponent: () => import('./pages/achievements/achievements.page').then((m) => m.AchievementsPage) },
  { path: 'levels', canActivate: [authGuard], loadComponent: () => import('./pages/levels/levels.page').then((m) => m.LevelsPage) },
  { path: 'discover', canActivate: [authGuard], loadComponent: () => import('./pages/discover/discover.page').then((m) => m.DiscoverPage) },
  { path: 'evaluation', canActivate: [authGuard], loadComponent: () => import('./pages/evaluation/evaluation.page').then((m) => m.EvaluationPage) },
  { path: 'challenge/:id', canActivate: [authGuard], loadComponent: () => import('./pages/challenge/challenge.page').then((m) => m.ChallengePage) },
  { path: '**', redirectTo: '' },
];
