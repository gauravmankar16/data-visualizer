import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupervisorDashboardComponent } from './supervisor-dashboard/supervisor-dashboard.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/components/login/login.component';
import { RegisterComponent } from './auth/components/register/register.component';
import { AuthGuardService } from './services/auth-guard.service';
import { ProfileComponent } from './main/profile/profile.component';
import { SupervisorBoardComponent } from './supervisor-board/supervisor-board.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'supervisorPage', canActivate: [AuthGuardService], component: SupervisorDashboardComponent },
  { path: 'profile', canActivate: [AuthGuardService], component: ProfileComponent },
  { path: 'supervisorBoard', canActivate: [AuthGuardService], component: SupervisorBoardComponent },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
