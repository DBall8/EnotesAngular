import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RightClickMenuComponent } from './right-click-menu.component';

describe('RightClickMenuComponent', () => {
  let component: RightClickMenuComponent;
  let fixture: ComponentFixture<RightClickMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RightClickMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RightClickMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
