/**
 * ExploreOrangeHRMSourcePage.ts — auto-generated aggregate Page Object Model.
 * Extends framework/base/BasePage and re-exports the site's page objects.
 */
import { Page } from '@playwright/test';
import { BasePage } from '../../../framework/base/BasePage';
import { DashboardPage } from './DashboardPage';
import { LeavePage } from './LeavePage';
import { LoginPage } from './LoginPage';
import { PIMPage } from './PIMPage';
import { RecruitmentPage } from './RecruitmentPage';
import { TimePage } from './TimePage';

export class ExploreOrangeHRMSourcePage extends BasePage {
  readonly dashboardPage: DashboardPage;
  readonly leavePage: LeavePage;
  readonly loginPage: LoginPage;
  readonly pimPage: PIMPage;
  readonly recruitmentPage: RecruitmentPage;
  readonly timePage: TimePage;

  constructor(page: Page) {
    super(page);
    this.dashboardPage = new DashboardPage(page);
    this.leavePage = new LeavePage(page);
    this.loginPage = new LoginPage(page);
    this.pimPage = new PIMPage(page);
    this.recruitmentPage = new RecruitmentPage(page);
    this.timePage = new TimePage(page);
  }

  /** Convenience login passthrough (uses the site's LoginPage). */
  async login(): Promise<void> {
    await this.loginPage.login();
  }
}
