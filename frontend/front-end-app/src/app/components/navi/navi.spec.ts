import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Navi } from './navi';

describe('Navi', () => {
  let component: Navi;
  let fixture: ComponentFixture<Navi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navi],
    }).compileComponents();

    fixture = TestBed.createComponent(Navi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
