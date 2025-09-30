import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { Admins } from './components/admins/admins';
import { Groups } from './components/groups/groups';
import { Channels } from './components/channels/channels';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    {
        path: '',
        component: Login,
    }, 
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [authGuard],
    }, 
    {
        path: 'login',
        component: Login,
    },
    {
        path: 'register',
        component: Register,
    },
    {
        path: 'groups',
        component: Groups,
        canActivate: [authGuard],
    },
    {
        path: 'channels',
        component: Channels,
        canActivate: [authGuard],
    },
    {
        path: 'admins',
        component: Admins,
        canActivate: [authGuard],
    }
];
