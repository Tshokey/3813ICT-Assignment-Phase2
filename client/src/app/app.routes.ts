import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { Admins } from './components/admins/admins';
import { Groups } from './components/groups/groups';
import { Channels } from './components/channels/channels';

export const routes: Routes = [
    {
        path: '',
        component: Dashboard,
    }, {
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
    },
    {
        path: 'channels',
        component: Channels,
    },
    {
        path: 'admins',
        component: Admins,
    }
];
