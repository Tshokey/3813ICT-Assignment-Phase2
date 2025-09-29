import { CanActivateFn, Router } from '@angular/router';
import { inject} from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const user = localStorage.getItem('currentUser');
  
  if(user){
    return true;
  }else{
    router.navigate(['/login'], {
    queryParams: {error: "You must be logged in to access this page"},
  })
   return false;
  }
};