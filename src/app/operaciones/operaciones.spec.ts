import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Operaciones } from './operaciones';

describe('Operaciones', () => {
  let component: Operaciones;
  let fixture: ComponentFixture<Operaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Operaciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Operaciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
