import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRequirements } from './user-requirements';

describe('UserRequirements', () => {
  let component: UserRequirements;
  let fixture: ComponentFixture<UserRequirements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRequirements]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRequirements);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
