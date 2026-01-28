import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QoutationForm } from './qoutation-form';

describe('QoutationForm', () => {
  let component: QoutationForm;
  let fixture: ComponentFixture<QoutationForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QoutationForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QoutationForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
