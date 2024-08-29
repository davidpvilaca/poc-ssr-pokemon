import { NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, makeStateKey, OnInit, TransferState } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { DataViewModule,  } from 'primeng/dataview';
import { finalize, tap } from 'rxjs';

const DATA_KEY = makeStateKey<any>('apiData');

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DataViewModule, NgFor, RouterLink, Button, NgIf],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  pokemons: any[] = []
  isLoading = true
  metadata = {
    count: 0,
    limit: 0,
    offset: 0,
    next: undefined as unknown as string,
    previous: undefined as unknown as string
  }

  constructor(private http: HttpClient, private state: TransferState) { }

  ngOnInit(): void {
    this.fetchPokemons()
  }

  fetchPokemons(url?: string): void {
    this.isLoading = true

    const apiUrl = url || 'https://pokeapi.co/api/v2/pokemon?limit=9'

    this.http.get<any>(apiUrl).pipe(
      tap(data => {
        this.state.set(DATA_KEY, data)
      }),
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      this.metadata = {
        count: data.count,
        next: data.next,
        previous: data.previous,
        limit: 9,
        offset: !url ? 0 : Number(url.replace(/.+offset=([0-9]+).+/, '$1'))
      }

      this.pokemons = []

      for (const pokemon of data.results) {
        this.http.get<any>(pokemon.url).subscribe(pokemonData => {
          this.pokemons.push(pokemonData)
        })
      }
    })
  }
}
